"use client"

import { ClientInfoVar } from '@/src/app/components/ClientInfoVar';
import { useState, useEffect } from 'react';

export default function ApiKeyInstructions() {
  // Move URL handling to state
  const [baseUrl, setBaseUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    setIsLoading(false)
  }, [])

  // Show nothing during hydration
  if (isLoading) {
    return null
  }

  const redirectUri = `${baseUrl}/api/canvas-oauth-export-callback`

  return (
    <div>
      <p>
        Add a Developer Key on your Canvas instance to allow teachers to load{' '}
        <ClientInfoVar field="clientName"/> units using OAuth2. See{' '}
        <a
          href="https://community.canvaslms.com/t5/Admin-Guide/How-do-I-add-a-developer-API-key-for-an-account/ta-p/259"
          target="_blank"
          rel="noreferrer"
        >
          instructions
        </a>.
      </p>

      <ul>
        <li>Type: API key</li>
        <li>Key Name: <ClientInfoVar field="clientName"/> Canvas Loader</li>
        <li>Redirect URI: {redirectUri}</li>
      </ul>
    </div>
  );
}
