const Message = require('../models/Message');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join user's personal room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`✅ User ${userId} joined room user_${userId}`);
      }
    });

    // Send message (text or media)
    socket.on('send_message', async (data) => {
      console.log('📨 Received send_message event:', data);
      
      try {
        const { conversationId, senderId, receiverId, text, messageType, mediaUrl, mediaName, mediaSize, mediaDuration } = data;

        if (!conversationId || !senderId || !receiverId) {
          console.error('❌ Missing required fields');
          socket.emit('message_error', { error: 'Missing required fields' });
          return;
        }

        let message;
        
        if (messageType && messageType !== 'text') {
          // Media message
          message = await Message.create({
            conversationId,
            sender: senderId,
            receiver: receiverId,
            messageType,
            mediaUrl,
            mediaName,
            mediaSize,
            mediaDuration: mediaDuration || 0,
            text: text || '',
          });
        } else {
          // Text message
          message = await Message.create({
            conversationId,
            sender: senderId,
            receiver: receiverId,
            text,
            messageType: 'text',
          });
        }

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        // Send to receiver's room
        io.to(`user_${receiverId}`).emit('receive_message', populatedMessage);
        
        // Also send back to sender
        socket.emit('message_sent', populatedMessage);
        
        console.log('✅ Message delivered');
      } catch (error) {
        console.error('❌ Error in send_message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle read receipts
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, userId } = data;
        
        const updatedMessages = await Message.updateMany(
          {
            conversationId,
            receiver: userId,
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );
        
        // Get updated messages to send read receipts
        const messages = await Message.find({
          conversationId,
          receiver: userId,
          read: true,
        }).populate('sender', 'name profilePicture');
        
        // Notify sender that messages were read
        messages.forEach(message => {
          io.to(`user_${message.sender._id}`).emit('message_read', {
            messageId: message._id,
            conversationId: message.conversationId,
            readAt: message.readAt,
          });
        });
        
        console.log(`📖 Marked ${updatedMessages.modifiedCount} messages as read`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle message edit
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, text, userId } = data;
        
        const message = await Message.findById(messageId);
        
        if (!message || message.sender.toString() !== userId) {
          return;
        }
        
        message.edited = true;
        message.editedAt = new Date();
        message.editedText = message.text;
        message.text = text;
        
        await message.save();
        
        const updatedMessage = await Message.findById(messageId)
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');
        
        // Broadcast to both users
        io.to(`user_${message.sender}`).emit('message_edited', updatedMessage);
        io.to(`user_${message.receiver}`).emit('message_edited', updatedMessage);
        
        console.log('✏️ Message edited:', messageId);
      } catch (error) {
        console.error('Error editing message:', error);
      }
    });

    // Handle message delete
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, userId, deleteForEveryone } = data;
        
        const message = await Message.findById(messageId);
        
        if (!message) return;
        
        const isParticipant = message.sender.toString() === userId || 
                             message.receiver.toString() === userId;
        
        if (!isParticipant) return;
        
        if (deleteForEveryone) {
          if (message.sender.toString() !== userId) return;
          message.deletedForEveryone = true;
          await message.save();
        } else {
          message.deletedFor.push(userId);
          await message.save();
        }
        
        // Broadcast deletion to both users
        io.to(`user_${message.sender}`).emit('message_deleted', {
          messageId,
          conversationId: message.conversationId,
          deletedForEveryone: deleteForEveryone,
        });
        
        io.to(`user_${message.receiver}`).emit('message_deleted', {
          messageId,
          conversationId: message.conversationId,
          deletedForEveryone: deleteForEveryone,
        });
        
        console.log('🗑️ Message deleted:', messageId);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
    });
  });
};

module.exports = setupSocket;