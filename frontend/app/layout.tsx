import './globals.css';
import 'antd/dist/reset.css';
import { AuthProvider } from '../app/(modules)/roleCheck/authContext'; 


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body> 
        <AuthProvider>
           {children}
        </AuthProvider>
      </body>
    </html>
  );
}