FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk --no-cache add curl

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Add proper error handling and make sure npm exits with correct codes
CMD ["npm", "start"] 