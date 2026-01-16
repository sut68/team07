package utils

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/google/uuid"
)

// UploadToAzure - ฟังก์ชันอเนกประสงค์ อัปโหลดได้ทุกไฟล์
// file: ไฟล์ที่รับมาจาก User (io.Reader)
// originalFilename: ชื่อไฟล์เดิม (เพื่อเอานามสกุล .pdf, .jpg)
// folder: ชื่อหมวดหมู่ (เช่น "projects", "chats", "news") -> จะไปสร้างเป็น Virtual Folder บน Azure
func UploadToAzure(file io.Reader, originalFilename string, folder string) (string, error) {
	connStr := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
	containerName := os.Getenv("AZURE_CONTAINER_NAME")

	if connStr == "" || containerName == "" {
		return "", fmt.Errorf("azure connection string or container name is missing")
	}

	// 2. ตั้งชื่อไฟล์ใหม่ด้วย UUID (ปลอดภัย + ไม่ซ้ำ)
	ext := filepath.Ext(originalFilename)           // ดึงนามสกุลไฟล์ (.pdf, .png)
	newFileName := uuid.New().String() + ext        // เช่น "a1b2-c3d4-....pdf"
	blobPath := fmt.Sprintf("%s/%s", folder, newFileName) // เช่น "projects/a1b2....pdf"

	// 3. เชื่อมต่อ Azure
	client, err := azblob.NewClientFromConnectionString(connStr, nil)
	if err != nil {
		return "", err
	}

	// 4. อัปโหลด
	_, err = client.UploadStream(context.TODO(),
		containerName,
		blobPath,
		file,
		&azblob.UploadStreamOptions{},
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