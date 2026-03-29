# ✅ Use official Node.js image
FROM node:18-alpine

# ✅ Create app directory
WORKDIR /app

# ✅ Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy entire project
COPY . .

# ✅ Set working directory to backend
WORKDIR /app/backend

# ✅ Expose port 8080
EXPOSE 8080

# ✅ Start the server
CMD ["node", "server.js"]
