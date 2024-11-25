<template>
    {{ rooms }}
    {{ messages }}
    <!-- <vue-advanced-chat 
        :current-user-id="currentUserId" 
        :rooms="JSON.stringify(rooms)"
        :messages="JSON.stringify(messages)" 
        :room-actions="JSON.stringify(roomActions)" 
        :messages-loaded="messagesLoaded"
        :rooms-loaded="roomsLoaded"
    /> -->
    <button @click="startTestConversation">Start test conversation</button>
    isReady: {{ isReady }}
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { register } from 'vue-advanced-chat'
import { useDm3Chat } from '../composables/chat'
register()

const roomsLoaded = ref(false);
const messagesLoaded = ref(false);

const { rooms, messages, init, startTestConversation, isReady } = useDm3Chat();

onMounted(() => {
    init();
})

const currentUserId = '1234'
// const rooms = [
//   {
//     roomId: '1',
//     roomName: 'Room 1',
//     avatar: 'https://i.pravatar.cc/300?u=1',
//     unreadCount: 4,
//     index: 3,
//     lastMessage: {
//       _id: 'xyz',
//       content: 'Last message received',
//       senderId: '1234',
//       username: 'John Doe',
//       timestamp: '10:20',
//       saved: true,
//       distributed: false,
//       seen: false,
//       new: true
//     },
//     users: [
//       {
//         _id: '1234',
//         username: 'John Doe',
//         avatar: 'https://i.pravatar.cc/300?u=1234',
//         status: {
//           state: 'online',
//           lastChanged: 'today, 14:30'
//         }
//       },
//       {
//         _id: '4321',
//         username: 'John Snow',
//         avatar: 'https://i.pravatar.cc/300?u=4321',
//         status: {
//           state: 'offline',
//           lastChanged: '14 July, 20:00'
//         }
//       }
//     ],
//     typingUsers: [ 4321 ]
//   }
// ]

// const messages=[
//   {
//     _id: '7890',
//     indexId: 12092,
//     content: 'Message 1',
//     senderId: '1234',
//     username: 'John Doe',
//     avatar: 'https://i.pravatar.cc/300?u=1234',
//     date: '13 November',
//     timestamp: '10:20',
//     system: false,
//     saved: true,
//     distributed: true,
//     seen: true,
//     deleted: false,
//     failure: true,
//     disableActions: false,
//     disableReactions: false,
//     // files: [
//     //   {
//     //     name: 'My File',
//     //     size: 67351,
//     //     type: 'png',
//     //     audio: true,
//     //     duration: 14.4,
//     //     url: 'https://firebasestorage.googleapis.com/...',
//     //     preview: 'data:image/png;base64,iVBORw0KGgoAA...',
//     //     progress: 88
//     //   }
//     // ],
//     reactions: {
//       '😁': [
//         '1234', // USER_ID
//         '4321'
//       ],
//       '🥰': [
//         '1234'
//       ]
//     },
//     replyMessage: {
//       content: 'Reply Message',
//       senderId: '4321',
//     //   files: [
//     //     {
//     //       name: 'My Replied File',
//     //       size: 67351,
//     //       type: 'png',
//     //       audio: true,
//     //       duration: 14.4,
//     //       url: 'https://firebasestorage.googleapis.com/...',
//     //       preview: 'data:image/png;base64,iVBORw0KGgoAA...'
//     //     }
//     //   ]
//     },
//   }
// ]

const roomActions = [
    { name: 'inviteUser', title: 'Invite User' },
    { name: 'removeUser', title: 'Remove User' },
    { name: 'deleteRoom', title: 'Delete Room' }
]

onMounted(() => {
    setTimeout(() => {
        messagesLoaded.value = true;
        roomsLoaded.value = true;
    }, 1000);
})
</script>
