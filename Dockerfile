FROM node:18-alpine

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose the development server port
EXPOSE 3000

# Start the Vite development server
CMD ["npm", "run", "dev"]