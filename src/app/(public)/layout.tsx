import '@picocss/pico/css/pico.min.css';
import '../styles/public/layout.css';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className='publicHeader'>
        <h1>{process.env.NEXT_PUBLIC_CLIENT_NAME} Canvas Loader</h1>
      </div>

      <div className='container' style={{ marginTop: '1em' }}>
        {children}
      </div>
    </>
  )
}
