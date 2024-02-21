<script setup>
import { computed, ref, onMounted } from 'vue'
import { useSessionStore } from '@/stores/session.js'
import { useAssetStore } from '@/stores/asset.js'
import { useBrowserStore } from '@/stores/browser.js'

const sessionStore = useSessionStore()
const assetStore = useAssetStore()
const browserStore = useBrowserStore()        

const userId = ref('')
const userEmail = ref('')
const userIsVerified = ref('false')
const userStorageSize = ref(0)
const userStorageUsed = ref(0)
const userNumTracks = ref(0)
const isDarkMode = ref(document.documentElement.classList.contains('dark'));

onMounted(async () => {
    const user = await sessionStore.getUser()
    userId.value = user.id
    userEmail.value = user.email
    userIsVerified.value = user.is_verified
    const userAssetInfo = await assetStore.fetchAssetInfo()
    userStorageSize.value = userAssetInfo.space_available
    userStorageUsed.value = userAssetInfo.space_used
    userNumTracks.value = userAssetInfo.num_tracks
})

const logout = () => {
    sessionStore.unsetToken()
    window.location.reload()
}

const setCookie = (name, value, days, sameSite = 'Lax') => {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    let cookieString = name + "=" + (value || "") + expires + "; path=/";

    // Append SameSite attribute
    cookieString += "; SameSite=" + sameSite;

    // If SameSite=None, also append Secure attribute
    if (sameSite === 'None') {
        cookieString += "; Secure";
    }

    document.cookie = cookieString;
}

const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
        setCookie('darkMode', 'true', 7, 'None');
    } else {
        document.documentElement.classList.remove('dark');
        setCookie('darkMode', 'false', 7, 'None');
    }
}

const formatSizeToGB = (kilobytes) => {
  const gigabytes = kilobytes / 1024 / 1024;
  return gigabytes.toFixed(1);
}

const progressBarWidth = computed(() => {
  const percentageUsed = (userStorageUsed.value / userStorageSize.value) * 100;
  return `${percentageUsed}%`;
})
</script>

<template>
    <div class="flex flex-col h-screen text-gray-800 dark:text-white bg-white dark:bg-ngreyblack">
        <div class="h-[62px] flex p-3 z-40 w-full border-b dark:border-b-4 dark:border-black bg-white dark:bg-ngreyblack">
            <div class="text-2xl font-bold cursor-pointer whitespace-nowrap mr-2 flex" v-if="!browserStore.sidebarActive">
                <font-awesome-icon icon="bars" class="ml-2.5 mr-2 mt-1 text-gray-500 hover:text-ngreenhover" @click="browserStore.sidebarActive = !browserStore.sidebarActive" />
            </div>
            <div class="text-2xl font-bold text-ngreenhover cursor-pointer whitespace-nowrap ml-1 flex">
                Account
            </div>
        </div>
        <div class="p-4">
            <div class="mb-2">
                <b>Email:</b>
                <span class="ml-4">{{ userEmail }}</span>
            </div>
            <div class="mb-2 mb-2">
                <b>Verified:</b>
                <span class="ml-4">{{ userIsVerified }}</span>
            </div>
            <div class="mb-2 mb-4 inline flex">
                <b>Storage:</b>
                <div v-if="userStorageSize > 0" class="storage-available ml-4 w-[280px]">
                    <div class="storage-filled bg-npurple" :style="{ width: progressBarWidth }"></div>
                </div>
                <span class="ml-4">{{ formatSizeToGB(userStorageUsed) }}{{ userStorageSize > 0 ? ` / ${formatSizeToGB(userStorageSize)}`: '' }} GB</span>
            </div>
            <div class="mb-2 mb-4 inline flex">
                <b>Number of Tracks:</b>
                <span class="ml-4">{{ userNumTracks }}</span>
            </div>
            <button class="bg-npurple text-white font-bold px-4 py-2 rounded mr-4" @click="toggleDarkMode">
                <template v-if="isDarkMode">UI Theme: Dark</template>
                <template v-else>UI Theme: Light</template>
            </button>
            <button class="bg-npurple text-white font-bold px-4 py-2 rounded" @click="logout">
                Logout
            </button>
        </div>
    </div>
</template>

<style scoped>
.storage-available {
  background-color: #ccc;
  border-radius: 8px;
  overflow: hidden;
}

.storage-filled {
  height: 24px;
  width: 0%; /* Default width */
  border-radius: 8px;
}
</style>
