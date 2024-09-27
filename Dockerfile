# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build the application

RUN yarn prisma generate

RUN yarn build


# Expose port 3000 to the outside world
EXPOSE 3000

# Set environment variable to production
ENV NODE_ENV=production

# Start the application and run migrations
CMD ["sh", "-c", "yarn prisma migrate deploy && yarn start"]
