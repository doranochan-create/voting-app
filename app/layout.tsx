export const metadata = {
  title: '投票',
  description: '投票サイト',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f9f9f9' }}>
        {children}
      </body>
    </html>
  );
}
