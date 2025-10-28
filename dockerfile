# Use a lightweight Node.js image
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --force --verbose

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Install Nest CLI globally
RUN npm i -g @nestjs/cli

# Start the application using npm script
CMD ["npm", "run", "start:prod"]

#test commit