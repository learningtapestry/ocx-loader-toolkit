
# ****OCX Loader Toolkit****

This is a toolkit to work with OCX content and create loaders to export them into LMSs like Canvas or
Google Classroom.

## Getting Started

First of all you need to install the dependencies; run `yarn` in the root of the project.

Then you need create a .env.local file with which points to your Postgres database (see below). After that you can
create the database and run the migrations with the following command:

```
blitz prisma migrate dev
```

Now you can run the base app in development mode:

```
blitz dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You will be required to create a user. After that you can go the Bundles page and click Create Bundle.

* Choose a name
* If you want to load the OCX from an online source, enter the URL of the sitemap.xml file. Leave this empty if you want to load the OCX from a zip file.

If you entered a URL, click the *Load Data* button. If you want to load a zip file, click on the *Import Zip* button.

## Environment Variables

Ensure the `.env.local` file has the required environment variables:

```
DATABASE_URL=postgresql://<YOUR_DB_USERNAME>@localhost:5432/ocx-loader
```

Ensure the `.env.test.local` file has the required environment variables. The Canvas instance
will be used to test the integration with the LMS. Every test will create a new course in the
Canvas instance.

```
DATABASE_URL=postgresql://<YOUR_DB_USERNAME>@localhost:5432/ocx-loader_test

CANVAS_BASE_URL=http://your.server/
CANVAS_ACCESS_TOKEN=your_token
```

## Integration with other services
All keys for setup can be generated in Rails using  SecureRandom.hex(64) or online tool to generate those.

### LCMS -> OCX-LOADER_TOOLKIT
Inside ocx-loader-toolkit, add ENV `HMAC_SECRET` with some key.
Inside lcms, add env `OCX_MATERIAL_EVENT_NAME` with some name we want to use for webhooks.

Inside LCMS, we need to generate `Lcms::Engine::Integrations::WebhookConfiguration` object, with:
- event_name: same as `OCX_MATERIAL_EVENT_NAME` env value in LCMS.
- active: true (default)
- endpoint_url: "OCX_LOADER_TOOLKIT_HOST/api/integrations/bundle-import-source-update?bundleImportSourceId=BUNDLE_IMPORT_SOURCE_FOR_THIS_APPLICATION"
Example:
Our toolkit application is "https://toolkit.com" and bundle import source for LCMS application inside toolkit got id 1. The endpoint url will be:
"https://toolkit.com/api/integrations/bundle-import-source-update?bundleImportSourceId=1"
- action: "post" (default)
- auth_type: "hmac"
- auth_credentials: { secret_key: HMAC_SECRET }

### OCX-LOADER-TOOLKIT -> LCMS
Inside LCMS, add ENV `API_SECRET_KEY` with some key.

Inside ocx-loader-toolkit create a Bundle Import Source with:
- Name: any name you want
- Type: "lcms-legacy-ose"
- base Url: lcms url
- api secret key: must be the same as this which is set inside lcms `API_SECRET_KEY` ENV variable

### OCX-LOADER-TOOLKIT -> Canvas LMS Instances
Inside Canvas instance we need to create a Api Key. To do so, go to Admin - Developer Keys - '+ Developer Key'. Put following data into fields:
- key name: any name you want
- owner email: your email or some admin email
- redirect URIs: OCX-LOADER-TOOLKIT_HOST + `/api/canvas-oauth-export-callback`

Inside OCX-LOADER-TOOLKIT click `create Canvas Instance`. Fill the data:
- Name: any name you want
- Base URL: URL of Canvas instance
- CLIENT ID and CLIENT_SECRET: get that info from previously generated developer key.

## Tests

Runs your tests using Jest.

```
yarn test
```

Blitz comes with a test setup using [Vitest](https://vitest.dev/) and [react-testing-library](https://testing-library.com/).


## This is a Blitz.js app

Read the [Blitz.js Documentation](https://blitzjs.com/docs/getting-started) to learn more.

## License

Copyright 2024 Learning Tapestry, Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
