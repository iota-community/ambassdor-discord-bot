# Use the official Node.js image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy the bot's source code (including entrypoint.sh)
COPY . .

# Ensure the entrypoint script is executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint script as the container's entry point
ENTRYPOINT ["/app/entrypoint.sh"]

