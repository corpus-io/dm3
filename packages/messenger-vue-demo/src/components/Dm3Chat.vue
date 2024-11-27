<template>
    <div v-if="!isReady" class="loading-animation">
        <p>Loading...</p>
    </div>
    <vue-advanced-chat 
        :loading-rooms="!isReady"
        :current-user-id="loggedInAccount" 
        :rooms="JSON.stringify(rooms)"
        :messages="JSON.stringify(messages)" 
        :room-actions="JSON.stringify(roomActions)" 
        :messages-loaded="messagesLoaded"
        :rooms-loaded="roomsLoaded"
        @fetch-messages="fetchMessages($event.detail[0])"
        @send-message="sendMessage($event.detail[0])"
    />
    <button :disabled="!isReady" @click="startTestConversation">Start test conversation</button>

    <details>
        <summary>Conversations Preview</summary>
        <pre>{{ JSON.stringify(conversationsPreview, null, 2) }}</pre>
    </details>
    <details>
        <summary>Rooms</summary>
        <pre>{{ JSON.stringify(rooms, null, 2) }}</pre>
    </details>
    <details>
        <summary>Messages</summary>
        <pre>{{ JSON.stringify(messages, null, 2) }}</pre>
    </details>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { register } from 'vue-advanced-chat'
import { useDm3Chat } from '../composables/chat'
register()
const { 
    messages,
    init,
    startTestConversation,
    isReady,
    conversationsPreview,
    rooms,
    fetchMessages,
    roomsLoaded,
    messagesLoaded,
    sendMessage
} = useDm3Chat();

onMounted(() => {
    init();
})

const currentUserId = '1234'

const roomActions = [
    { name: 'inviteUser', title: 'Invite User' },
    { name: 'removeUser', title: 'Remove User' },
    { name: 'deleteRoom', title: 'Delete Room' }
]

</script>
