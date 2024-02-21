<script setup>
import { Howl } from 'howler';
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router'
import { useBrowserStore } from '@/stores/browser.js'

const router = useRouter()
const browserStore = useBrowserStore()

const props = defineProps({
    datasource: {
        type: String,
        required: true
    },
    track: {
        type: Object,
        required: true
    }
})
const emit = defineEmits(['updateTrackStatus', 'updateTrackCurrentTime'])

const sound = ref(null);
const playState = ref('play')
const currentTime = ref('0:00')
const totalTime = ref('0:00')
const progress = ref(0)
const isUpdating = ref(false);

const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60) || 0
    const seconds = secs - minutes * 60 || 0
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const updateProgress = () => {
    if (sound.value) {
        isUpdating.value = true;
        const seek = sound.value.seek() || 0;
        progress.value = (seek / sound.value.duration()) * 100;
        currentTime.value = formatTime(Math.round(seek));
        requestAnimationFrame(updateProgress)
        emit('updateTrackCurrentTime', {trackCurrentTime: seek, trackTotalTime: sound.value.duration()})
    } else {
        isUpdating.value = false;
    }
}

const seekAudio = (event) => {
    if (sound.value) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left; // Click position within the progress bar
        const width = rect.width;
        const clickPositionRatio = clickX / width;
        const seekTime = sound.value.duration() * clickPositionRatio;
        sound.value.seek(seekTime);
        progress.value = clickPositionRatio * 100;
    }
}

let globalVolume = ref(1)
const volumebar = ref(null)

const adjustVolume = (checkmousedown, event) => {
    if (checkmousedown && !event.buttons) {
        return;
    }
    const rect = volumebar.value.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newVolume = clickX / width;
    globalVolume.value = newVolume;

    if (sound.value) {
        sound.value.volume(newVolume);
    }
};

const getVolumeWidth = computed(() => {
    return `${globalVolume.value * 100}%`
})

const initializeSound = (source) => {
    if (sound.value) {
        sound.value.unload()
    }
    sound.value = new Howl({
        src: [source],
        html5: true,
        format: ['mp3'],
        onload: () => {
            totalTime.value = formatTime(Math.round(sound.value.duration()))
            playState.value = 'play'
        },
        onplay: () => {
            requestAnimationFrame(updateProgress);
            playState.value = 'pause'
        },
        onpause: () => {
            playState.value = 'play'
        },
        onend: () => {
            playState.value = 'play'
            progress.value = 0
            emit('updateTrackStatus', 'stop')
        }
    })
}

const destroyPlayer = ()  => { 
    if (sound.value) {
        sound.value.unload()
        sound.value = null
    }
}

const togglePlayPause = () => {
    if (!sound.value) {
        initializeSound(props.datasource)
    }
    if (sound.value.playing()) {
        sound.value.pause()
        emit('updateTrackStatus', 'pause')
    } else {
        sound.value.play()
        emit('updateTrackStatus', 'play')
    }
}

const resetAudio = () => {
    if (sound.value && !sound.value.playing()) {
        sound.value.seek(0)
    }
}

const playSound = () => {
    if (sound.value && !sound.value.playing()) {
        sound.value.play()
    }
}

const gotoTrack = (track) => {
    router.push({ path: '/library/' + track.id })
}

const getTrackTitle = (track) => {
    if (track) {
        if (track.meta.title) {
            return track.meta.title
        } else if (track.resource && track.resource.meta.original_filename) {
            return track.resource.meta.original_filename
        } else {
            return 'NONAME'
        }
    }
    return 'NONAME'
}

function getTrackImage(track, spectrogram = true) {
    if (track && track.images) {
        let coverImage
        coverImage = track.images.find(
            (image) => (image.meta.image_type === 'cover')
        )
        // backup to cover image: spectrogram
        if (!coverImage && spectrogram) {
            coverImage = track.images.find(
                (image) => (image.meta.image_type === 'spectrogram')
            )
        }
        if (coverImage && coverImage.file_name.length > 0) {
            return '/api/assets/image/' + coverImage.file_name 
        }
    }

    // backup to album cover and spectrogram: placeholder
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) { 
        return '/assets/cover_placeholder_dark.webp'
    }
    return '/assets/cover_placeholder.webp'
}

const progressContainer = ref(null);
const dragging = ref(false);

const startDrag = (event) => {
    event.preventDefault();
    dragging.value = true;
    dragSeek(event);
};

const dragSeek = (event) => {
    if (dragging.value && sound.value && progressContainer.value) {
        seekAudio(event)
    }
};

const stopDrag = () => {
    if (dragging.value && sound.value) {
        const seekTime = sound.value.duration() * (progress.value / 100);
        sound.value.seek(seekTime);
    }
    dragging.value = false;
};

watch(() => props.datasource, (newSource) => {
    if (newSource) {
        initializeSound(newSource);
        playSound();
    }
})

watch(() => browserStore.audioPlayerSeek, (seektime) => {
    if (seektime) {
        sound.value.seek(seektime);
    }
})

defineExpose({ togglePlayPause, destroyPlayer })

</script>
  
<template>
    <div class="items-center flex bg-white dark:bg-ngreyblack p-4 border-t dark:border-t-4 dark:border-black w-full" v-if="track.id">
        <div class="flex text-xs pr-[60px]">
            <img :src="getTrackImage(track, false)" class="rounded h-[35px] w-[35px] invert dark:invert-0"/>
            <div class="ml-5 flex flex-col items-start justify-center">
                <div class="cursor-pointer hover:underline truncate w-40 font-medium" @click="gotoTrack(track)">
                    {{ getTrackTitle(track) }}
                </div>
                <template v-if="track.meta.artist">
                    <div class="text-gray-500 cursor-pointer hover:underline truncate w-40 text-xs">
                        {{ track.meta.artist}}
                    </div>
                </template>
            </div>
        </div>

        <div class="w-full max-w-[1000px] mx-auto flex">
            <button class="play-pause-btn" @click="togglePlayPause">
                <svg v-if="playState === 'play'" viewBox="0 0 24 24" class="icon-play" >
                    <path fill="black" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                </svg>
                <svg v-if="playState === 'pause'" viewBox="0 0 24 24" class="icon-pause">
                    <path fill="black" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                </svg>
                <svg v-if="playState === 'loading'" viewBox="0 0 50 50" class="icon-loading">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="black" stroke-width="4" stroke-linecap="round" stroke-dasharray="100, 200">
                        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                    </circle>
                </svg>
            </button>
            <div class="progress-container mobilehide">
                <span class="text-xs min-w-[40px]">{{ currentTime }}</span>
                <div class="progress-container-inner group" ref="progressContainer" @click="seekAudio($event)" @mousemove="dragging && dragSeek($event)" @mouseup="dragging && stopDrag()">
                    <div class="progress-container-inner-bg bg-gray-300 dark:bg-[#424242]">
                        <div class="progress-bar bg-gray-500 dark:bg-[#d1d5db]" :style="{ width: progress + '%' }" @mousedown="startDrag">
                            <div class="seek-handle" @mousedown="startDrag" :style="{ left: progress + '%' }">
                                <div class="w-[13px] h-[13px] -mt-1 rounded-full bg-white shadow border border-gray-200 float-right invisible group-hover:visible"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <span class="text-xs">{{ totalTime }}</span>
            </div>
        </div>

        <div class="flex ml-4 mobilehide">
            <font-awesome-icon
                icon="volume-down"
                class="mx-auto mt-1 text-gray-400"
            />
            <div
                class="bg-gray-300 dark:bg-gray-700 w-[100px] h-[4px] rounded-full mt-2 mx-2 cursor-pointer group"
                ref="volumebar"
                @click="adjustVolume(false, $event)"
                @mousemove="adjustVolume(true, $event)"
            >
                <div
                    class="w-[30px] h-[4px] rounded-full group-hover:bg-green-500 bg-gray-500 dark:bg-gray-300"
                    :style="{ width: getVolumeWidth }"
                >
                    <div class="w-[13px] h-[13px] -mt-1 rounded-full bg-white shadow border border-gray-200 float-right invisible group-hover:visible"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.play-pause-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 100%;
}
.play-pause-btn svg {
    color: black;
    width: 32px;
    height: 32px;
    padding: 5px;
}

.progress-container {
    display: flex;
    align-items: center;
    flex: 1;
    margin: 0 20px;
    padding-right: 0;
}

.progress-container-inner {
    width: 100%;
    height: 24px;
    position: relative;
    margin-right: 10px;
}
.progress-container-inner-bg {
    margin-top: 8px;
    height: 4px;
    position: relative;
    border-radius: 50px;
}

.progress-bar {
    height: 100%;
    height: 4px;
    /* background-color: #d1d5db; */
    width: 0; /* Initial width */
    border-radius: 50px;
}
</style>
