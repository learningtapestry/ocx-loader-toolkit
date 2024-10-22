"use client"

export default function ApiKeyInstructions() {
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  }

  const redirectUri = `${baseUrl}/api/canvas-oauth-export-callback`;

  return <div>
    <p>
      Create a Developer API key on your Canvas instance to allow teachers to export units using OAuth2. See <a
        href="https://community.canvaslms.com/t5/Admin-Guide/How-do-I-manage-developer-keys-for-an-account/ta-p/249"
        target="_blank" rel="noreferrer"
      >
        instructions
      </a>.
    </p>

    <p>
      <ul>
        <li>Type: API key</li>
        <li>Redirect URI: {redirectUri}</li>
      </ul>
    </p>
  </div>
}
