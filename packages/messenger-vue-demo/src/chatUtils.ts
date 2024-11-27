import type { Conversation } from "@dm3-org/dm3-js-sdk";
import { MessageIndicator } from "@dm3-org/dm3-js-sdk";
 
export type ChatRoom = {
    roomId: string;
    roomName: string;
    avatar: string;
    unreadCount: number;
    index: number;
    lastMessage: {
        _id: string;
        content: string;
        senderId: string;
        username: string;
        timestamp: string;
        saved: boolean;
        distributed: boolean;
        seen: boolean;
        new: boolean;
    };
    users: {
        _id: string;
        username: string;
        avatar: string;
        status: {
        state: string;
        lastChanged: string;
        };
    }[];
    typingUsers: string[];
};
  

  export function transformToRooms(inputData: Conversation[]): ChatRoom[] {
    // const initialisedMessages = await Promise.all(inputData.map((data) => { data.messages.init() }));

    const rooms = inputData.map((data, index) => {
      const { contact, messages } = data;

      const allParticipants = messages.participants.map((participant) => {        
        return {
            _id:  participant.account.ensName,
            username: participant.name,
            avatar: participant.image || "assets/imgs/sender.png", // TODO: get from contacts list
            status: {
              state: (new Date().getTime() - new Date(participant.updatedAt).getTime()) < 3600000 ? "online" : "offline",
              lastChanged: new Date(participant.updatedAt).toLocaleString(),
            },
        }
      });

      const lastMessage = messages.list[messages.list.length - 1];

      return {
        roomId: `${contact.account.ensName}`,
        roomName: contact.name,
        avatar: contact.image || "assets/imgs/people.png",
        unreadCount: 0, // Default value, can be adjusted
        index: index,
        lastMessage: {
          _id: `${lastMessage.envelop.id}`,
          content: `${lastMessage?.envelop.message.message}`|| "No last message received", // Placeholder
          senderId: lastMessage?.envelop.message.metadata.from,
          username: contact.name,
          timestamp: new Date(lastMessage?.envelop.message.metadata.timestamp).toLocaleString(),
          // TODO: check if states are correct
          saved: lastMessage?.indicator === MessageIndicator.RECEIVED,
          distributed: lastMessage?.indicator === MessageIndicator.SENT,
          seen: lastMessage?.indicator === MessageIndicator.READED,
          new: lastMessage?.indicator !== MessageIndicator.READED,
        },
        users: allParticipants,
        typingUsers: [], // Default empty
      };
    });

    return rooms;
  }

  export function transformToMessages(messagesData: any[]): any[] {
    return messagesData.map((message) => {
      console.log('message', message);

      // Ensure _id and senderId are valid
      const _id = message.envelop.id ? String(message.envelop.id) : "unknown_id";
      const senderId = message.envelop.message.metadata.from ? String(message.envelop.message.metadata.from) : "unknown_sender";

      return {
        _id: _id,
        indexId: message.indexId || null, // Assuming indexId is available or null
        content: message.envelop.message.message || "No content",
        senderId: senderId,
        username: message.senderName || "Unknown", // Assuming senderName is available
        avatar: message.senderAvatar || "assets/imgs/default.png", // Assuming senderAvatar is available
        date: new Date(message.envelop.message.metadata.timestamp).toLocaleDateString(),
        timestamp: new Date(message.envelop.message.metadata.timestamp).toLocaleTimeString(),
        system: message.system || false,
        saved: message.indicator === MessageIndicator.RECEIVED,
        distributed: message.indicator === MessageIndicator.SENT,
        seen: message.indicator === MessageIndicator.READED,
        deleted: message.deleted || false,
        failure: message.failure || false,
        disableActions: message.disableActions || false,
        disableReactions: message.disableReactions || false,
        files: message.files || [],
        reactions: message.reactions || {},
        replyMessage: message.replyMessage || null,
      };
    });
  }
