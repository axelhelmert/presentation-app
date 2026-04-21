export const metadata = {
  title: 'Remote Control',
  robots: 'noindex',
};

export default function RemoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      {children}
    </>
  );
}
