FROM node:18-alpine

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm install

# Copy shared package
COPY packages/shared ./packages/shared

# Build shared package
RUN npm run build --workspace=@perper/shared

# Copy backend source
COPY apps/backend ./apps/backend

# Build backend
RUN npm run build --workspace=@perper/backend

EXPOSE 8080

CMD ["npm", "run", "start", "--workspace=@perper/backend"]
