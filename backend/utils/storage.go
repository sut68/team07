package utils

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blob"
	"github.com/google/uuid"
)

// UploadToAzure - ฟังก์ชันอเนกประสงค์ อัปโหลดได้ทุกไฟล์
func UploadToAzure(file io.Reader, originalFilename string, folder string, contentType string) (string, error) {
	connStr := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
	containerName := os.Getenv("AZURE_CONTAINER_NAME")

	if connStr == "" || containerName == "" {
		// Fallback to local storage
		cwd, err := os.Getwd()
		if err != nil {
			return "", err
		}

		// Ensure directory exists
		uploadDir := filepath.Join(cwd, "uploads", folder)
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			return "", err
		}

		// Clean filename
		ext := filepath.Ext(originalFilename)
		nameWithoutExt := strings.TrimSuffix(filepath.Base(originalFilename), ext)
		reg := regexp.MustCompile("[^a-zA-Z0-9-_]")
		cleanName := reg.ReplaceAllString(nameWithoutExt, "_")
		if len(cleanName) > 50 {
			cleanName = cleanName[:50]
		}
		newFileName := fmt.Sprintf("%s_%s%s", uuid.New().String(), cleanName, ext)
		localPath := filepath.Join(uploadDir, newFileName)

		// Create file
		out, err := os.Create(localPath)
		if err != nil {
			return "", err
		}
		defer out.Close()

		if _, err = io.Copy(out, file); err != nil {
			return "", err
		}

		// Return just the filename so frontend can construct URL
		return newFileName, nil
	}

	// 2. ตั้งชื่อไฟล์ใหม่ด้วย UUID (ปลอดภัย + ไม่ซ้ำ)
	ext := filepath.Ext(originalFilename)           // ดึงนามสกุลไฟล์ (.pdf, .png)
	
	// Clean original filename part
	nameWithoutExt := strings.TrimSuffix(filepath.Base(originalFilename), ext)
	reg := regexp.MustCompile("[^a-zA-Z0-9-_]") // Allow letters, numbers, -, _
	cleanName := reg.ReplaceAllString(nameWithoutExt, "_")
	
	// Truncate if too long (optional, to keep URL reasonable)
	if len(cleanName) > 50 {
		cleanName = cleanName[:50]
	}

	// UUID_cleanName.ext
	newFileName := fmt.Sprintf("%s_%s%s", uuid.New().String(), cleanName, ext)
	blobPath := fmt.Sprintf("%s/%s", folder, newFileName) // เช่น "projects/a1b2_Report.pdf"

	// 3. เชื่อมต่อ Azure
	client, err := azblob.NewClientFromConnectionString(connStr, nil)
	if err != nil {
		return "", err
	}

	contentDisposition := fmt.Sprintf("inline; filename=\"%s\"", originalFilename)

	// 4. อัปโหลด
	_, err = client.UploadStream(context.TODO(),
		containerName,
		blobPath,
		file,
		&azblob.UploadStreamOptions{
			HTTPHeaders: &blob.HTTPHeaders{
				BlobContentType:        &contentType,
				BlobContentDisposition: &contentDisposition,
			},
		},
	)

	if err != nil {
		return "", err
	}

	// 5. สร้าง URL กลับไปให้ Database
	// ตัดเอาชื่อ Account ออกมาจาก Connection String เพื่อสร้าง Link
	// รูปแบบ Link: https://<account>.blob.core.windows.net/<container>/<folder>/<filename>
	parts := strings.Split(connStr, "AccountName=")
	accountName := strings.Split(parts[1], ";")[0]
	
	publicURL := fmt.Sprintf("https://%s.blob.core.windows.net/%s/%s", accountName, containerName, blobPath)

	return publicURL, nil
}