### Canvas API Call Examples

These are some useful variables that get referenced a in the examples below but they are optional.
```BASH
export LT_CANVAS_HOST="learningtapestry.instructure.com"
export LT_CANVAS_CLIENT_ID='269400000000000009'
export LT_CANVAS_REFRESH='26940~z8JxxxxxxxxxxxxxxxxxxxxnPak76B'

# The refresh token is available in the Loader Admin > ExportDestination.
# If you do not have any entries, you will need to link Canvas to the loader. See main README.md or canvas-link.md.
export LT_CANVAS_SECRET='AVRELxxxxxxxxxxxxxxxxxxxxxxRXA'

# You will not have this value initially, but you will get it using the #1 call
export LT_ACCESS='26940~aENLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxuQZ8'
```

### 1. Refresh the Access Token

```BASH
curl -X POST "https://${LT_CANVAS_HOST}/login/oauth2/token" \
  -F grant_type=refresh_token \
  -F "client_id=${LT_CANVAS_CLIENT_ID}" \
  -F "client_secret=${LT_CANVAS_SECRET}" \
  -F "refresh_token=${LT_CANVAS_REFRESH}"
```

### 2. Retrieve Courses

```BASH
curl -X GET "https://${LT_CANVAS_HOST}/api/v1/courses/" \
    -H "Authorization: Bearer ${LT_ACCESS}"
```

### 3. Assignments

List
```BASH
curl -X GET "https://${LT_CANVAS_HOST}/api/v1/courses/426/assignments" \
    -H "Authorization: Bearer ${LT_ACCESS}"
```

Create
```BASH
curl -X POST "https://${LT_CANVAS_HOST}/api/v1/courses/426/assignments" \
    -H "Authorization: Bearer ${LT_ACCESS}" \
    -H "Content-Type: application/json" \
    -d '{ "assignment": { "name": "Sample Assignment", "published": true, "description": "<iframe src=\"https://macbook-pro-2.tail35132f.ts.net/\"></iframe>", "course_id": 426 } }' 
```

Example body:
```JSON
{ "name": "Sample Assignment", "published": true, "description": "<iframe src=\"https://macbook-pro-2.tail35132f.ts.net/\"></iframe>" }
```