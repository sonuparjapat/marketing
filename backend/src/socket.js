const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowed = [process.env.FRONTEND_URL, /^http:\/\/localhost:\d+$/, /^exp:\/\//];
        if (!origin) return callback(null, true);
        const ok = allowed.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin));
        callback(ok ? null : new Error('Not allowed by CORS'), ok);
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.admin = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('admins');
    socket.on('disconnect', () => {});
  });

  return io;
}

function emitToAdmins(event, payload) {
  if (io) io.to('admins').emit(event, payload);
}

module.exports = { initSocket, emitToAdmins };
