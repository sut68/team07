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
      <body> 
        <AuthProvider>
           {children}
        </AuthProvider>
      </body>
    </html>
  );
}