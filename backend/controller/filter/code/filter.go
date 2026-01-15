package filter

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	ort "github.com/yalue/onnxruntime_go"
)

var ortInitOnce sync.Once
var ortInitErr error

func initOrt(libPath string) error {
	ortInitOnce.Do(func() {
		ort.SetSharedLibraryPath(libPath)
		ortInitErr = ort.InitializeEnvironment()
	})

	// If the library returns a specific "already initialized" error, allow it
	if ortInitErr != nil && strings.Contains(strings.ToLower(ortInitErr.Error()), "already") {
		return nil
	}
	return ortInitErr
}

type MetaData struct {
	WordIndex map[string]int `json:"word_index"`
	MaxLen    int            `json:"max_len"`
}

type SpamController struct {
	Session *ort.DynamicAdvancedSession
	Meta    MetaData
}

func NewSpamController(modelPath, metaPath, libPath string) (*SpamController, error) {
	if err := initOrt(libPath); err != nil {
		return nil, fmt.Errorf("ORT init failed (libPath=%s): %w", libPath, err)
	}

	file, err := os.ReadFile(metaPath)
	if err != nil {
		return nil, fmt.Errorf("cannot read meta json: %w", err)
	}

	var meta MetaData
	if err := json.Unmarshal(file, &meta); err != nil {
		return nil, fmt.Errorf("cannot parse meta json: %w", err)
	}
	if meta.MaxLen == 0 {
		meta.MaxLen = 100
	}

	inputInfo, outputInfo, err := ort.GetInputOutputInfo(modelPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get model input/output info: %w", err)
	}
	if len(inputInfo) == 0 || len(outputInfo) == 0 {
		return nil, fmt.Errorf("model structure invalid: no inputs or outputs found")
	}

	inputName := inputInfo[0].Name
	outputName := outputInfo[0].Name
	log.Printf("🔍 Model IO: input=%q output=%q", inputName, outputName)

	session, err := ort.NewDynamicAdvancedSession(
		modelPath,
		[]string{inputName},
		[]string{outputName},
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load ONNX model: %w", err)
	}

	log.Println("✅ AI Model Loaded Successfully")
	return &SpamController{Session: session, Meta: meta}, nil
}

func (sc *SpamController) CheckSpam(c *gin.Context) {

	var req struct {
		Text string `json:"text"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	isSpam, score, err := sc.predict(req.Text)
    if err != nil {
    log.Println("Spam inference failed:", err)
    c.JSON(http.StatusInternalServerError, gin.H{"error": "spam model not available"})
    return
    }

	c.JSON(http.StatusOK, gin.H{
		"text":    req.Text,
		"is_spam": isSpam,
		"score":   score,
	})
}

func (sc *SpamController) predict(text string) (bool, float32, error) {
  inputTensor, err := ort.NewStringTensor(ort.NewShape(1, 1))
  if err != nil {
    return false, 0, fmt.Errorf("create input tensor: %w", err)
  }
  defer inputTensor.Destroy()

  inputTensor.SetContents([]string{text})

  // NOTE: output type must match your model. int64 may be wrong for many models.
  outputTensor, err := ort.NewEmptyTensor[int64](ort.NewShape(1))
  if err != nil {
    return false, 0, fmt.Errorf("create output tensor: %w", err)
  }
  defer outputTensor.Destroy()

  if err := sc.Session.Run([]ort.Value{inputTensor}, []ort.Value{outputTensor}); err != nil {
    return false, 0, fmt.Errorf("inference: %w", err)
  }

  label := outputTensor.GetData()[0]
  return label == 1, float32(label), nil
}
