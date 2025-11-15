import './globals.css';
import LayoutSwitcher from './components/LayoutSwitch'; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body> 
        <LayoutSwitcher>{children}</LayoutSwitcher> 
      </body>
    </html>
  );
}