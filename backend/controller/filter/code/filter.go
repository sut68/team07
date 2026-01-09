package filter

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	ort "github.com/yalue/onnxruntime_go"

	"fmt"
	"log"
	"net/http"
	"os"

)


type MetaData struct {
	WordIndex map[string]int `json:"word_index"`
	MaxLen    int            `json:"max_len"`
}

type SpamController struct {
	Session *ort.DynamicAdvancedSession
	Meta    MetaData
}


func NewSpamController(modelPath, metaPath, libPath string) (*SpamController, error) {

    ort.SetSharedLibraryPath(libPath)
    err := ort.InitializeEnvironment()
    if err != nil {
        log.Printf("Warning: ORT might already be initialized: %v", err)
    }


    file, err := os.ReadFile(metaPath)
    if err != nil {
        return nil, fmt.Errorf("Cannot read meta json: %w", err)
    }
    var meta MetaData
    json.Unmarshal(file, &meta)
    if meta.MaxLen == 0 {
        meta.MaxLen = 100
    }


    inputInfo, outputInfo, err := ort.GetInputOutputInfo(modelPath)
    if err != nil {
        return nil, fmt.Errorf("Failed to get model input/output info: %w", err)
    }


    if len(inputInfo) == 0 || len(outputInfo) == 0 {
        return nil, fmt.Errorf("Model structure invalid: No inputs or outputs found")
    }

    inputName := inputInfo[0].Name
    outputName := outputInfo[0].Name

    fmt.Printf("🔍 Auto-detected Model Input: '%s' | Output: '%s'\n", inputName, outputName)

    // 4. Create Session with Correct Names
    session, err := ort.NewDynamicAdvancedSession(
        modelPath,
        []string{inputName},   // Pass the detected input name
        []string{outputName},  // Pass the detected output name
        nil,
    )
    if err != nil {
        return nil, fmt.Errorf("Failed to load ONNX model: %w", err)
    }

    fmt.Println("AI Model Loaded Successfully")
    return &SpamController{
        Session: session,
        Meta:    meta,
    }, nil
}


func (sc *SpamController) CheckSpam(c *gin.Context) {
    
    var req struct {
        Text string `json:"text"`
    }

 
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
        return
    }

  
    isSpam, score := sc.predict(req.Text)


    c.JSON(http.StatusOK, gin.H{
        "text":    req.Text,
        "is_spam": isSpam,
        "score":   score,
    })
}


func (sc *SpamController) predict(text string) (bool, float32) {
    // 1. Prepare Input (String Tensor)
    inputData := []string{text}
    inputShape := ort.NewShape(1, 1)

    inputTensor, err := ort.NewStringTensor(inputShape)
    if err != nil {
        log.Println("Error creating string input tensor:", err)
        return false, 0
    }
    defer inputTensor.Destroy()
    inputTensor.SetContents(inputData)

 
    outputShape := ort.NewShape(1)
    
    
    outputTensor, err := ort.NewEmptyTensor[int64](outputShape)
    if err != nil {
        log.Println("Error creating output tensor:", err)
        return false, 0
    }
    defer outputTensor.Destroy()


    err = sc.Session.Run(
        []ort.Value{inputTensor},
        []ort.Value{outputTensor},
    )
    if err != nil {
        log.Println("Inference Error:", err)
        return false, 0.0
    }

  
    results := outputTensor.GetData()
    label := results[0] 
    
    isSpam := label == 1
    

    score := float32(label) 

    return isSpam, score
}

