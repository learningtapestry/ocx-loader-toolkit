import '@picocss/pico/css/pico.min.css';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='container' style={{ marginTop: '1em' }}>{children}</div>
}
