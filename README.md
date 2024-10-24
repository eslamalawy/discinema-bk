# DisCinema Backend
DisCinema Backend is the server-side API for a streaming platform that focuses on delivering anime content. It provides the necessary endpoints for managing users, anime series, and streaming sessions. Built with modern technologies, it ensures secure user access and efficient content management.

## Features
- User Management: Handles user registration, login, and profile management.
- Anime Series Management: Create, update, and delete anime series.
- Streaming System: Manages streaming sessions, including episode listings and playback details.
- Role-Based Access: Provides different access levels for users (admin, regular users).
- Error Handling & Validation: Built-in validation for requests and proper error handling.
- JWT Authentication: Ensures secure access to the platform with JSON Web Tokens.

## Tech Stack
- Node.js: JavaScript runtime for backend development.
- Express.js: Web framework for building RESTful APIs.
- MongoDB: NoSQL database for storing user, anime, and streaming session data.
- Mongoose: ODM for MongoDB to easily interact with the database.
- JWT (JSON Web Tokens): For secure user authentication and authorization.
- Bcrypt.js: Password hashing for enhanced security.

## Installation

### Clone the repository:
`git clone https://github.com/eslamalawy/discinema-bk`
`cd discinema-bk`

### Install dependencies:
`npm install`

### Set up environment variables: Create a .env file in the root directory and define the following:
`MONGO_URI=<Your MongoDB connection string>`
`JWT_SECRET=<Your JWT secret>`
`PORT=<Port number>`

### Run the application:
`npm start`

## Development
Node.js version: 14.x and above
Database: MongoDB Atlas or local MongoDB instance

## Contributing
Contributions are welcome! Please open a pull request or create an issue to discuss your ideas.

### Authors  
[eslam alawy](https://github.com/eslamalawy)   
[koot magdy](https://github.com/kootmagdy)
