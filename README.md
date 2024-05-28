
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

## Tests

Runs your tests using Jest.

```
yarn test
```

Blitz comes with a test setup using [Vitest](https://vitest.dev/) and [react-testing-library](https://testing-library.com/).


## This is a Blitz.js app

Read the [Blitz.js Documentation](https://blitzjs.com/docs/getting-started) to learn more.

## License
