# Canvas OAuth Configuration

To setup OAuth linking with a Canvas:
1.  Create a new Canvas instance using the following URL: http://localhost:3000/public-canvas-instances/new (note the instructions to create a developer key prior, as indicated in the page with the link to this Canvas [article](https://community.canvaslms.com/t5/Admin-Guide/How-do-I-add-a-developer-API-key-for-an-account/ta-p/259))
2. In the OCX Loader Admin panel -> CanvasInstance - find this created CanvasInstance and note its ID.
3. Using Base64, encode the following JSON (replace the ID and base URL, name can be anything)

    ```JSON
    { "name": "Canvas Local", "canvasInstanceId": 83, "baseUrl": "http://localhost:3123" }
    ```
4. Form your URL connection as follows: `${canvasUrl}/login/oauth2/auth?client_id=${developerKeyId}$&response_type=code&state=${base64String}&redirect_uri=${ocxLoaderUrl}/api/canvas-oauth-callback`

    For example:
    ```
    http://localhost:3123/login/oauth2/auth?client_id=10000000000001&response_type=code&state=eyAibmFtZSI6ICJDYW52YXMgTG9jYWwiLCAiY2FudmFzSW5zdGFuY2VJZCI6IDgzLCAiYmFzZVVybCI6ICJodHRwOi8vbG9jYWxob3N0OjMxMjMiIH0=&redirect_uri=http://localhost:3000/api/canvas-oauth-callback
    ```
5. Open this URL in your Browser. This will show you the Canvas screen to allow connections. After you confirm, you will be taken back to the loader with a 404 error. This is fine (at the time of writing).