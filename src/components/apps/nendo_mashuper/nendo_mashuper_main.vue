<script setup>
import { computed,   onBeforeUnmount, onMounted, onUnmounted, ref, reactive, watch } from 'vue'
import modal from '@/components/apps_components/component_modal.vue'
import { audioPlayer, indicatorWidths } from '@/components/apps/nendo_mashuper/AudioEngine.vue'
import { v4 as uuidv4 } from 'uuid'
import { useSessionStore } from '@/stores/session.js'
import { useBrowserStore } from '@/stores/browser.js'
import draggable from 'vuedraggable'
import { useToast } from 'vue-toast-notification'
import SlotMachine from '@/components/apps/nendo_mashuper/slotmachine.vue'
import CollectionPicker from '@/components/apps_components/component_collection_picker.vue'
import Exporter from '@/components/apps_components/component_exporter.vue'

const props = defineProps({
    collectionId: {
        type: String,
        required: false
    },
})

const emit = defineEmits(['modalClosed'])

const BASE_API_URL = import.meta.env.VITE_API_URL
let audioPlayerAPI = null
const slotMachineRefs = reactive([])
const isPlaying = ref(false)
const scenesBrowser = ref(false)
const isOpen = ref(false)
const exporterShow = ref(false)

const collection = reactive({
  id: '',
  name: '',
})

const scenes = reactive({
  currentScene: {},
  scenesDB: []
})

const lib = reactive({
  channels: []
})

const soundTypes = ref([
  {
    name: 'Bass',
    image: '/assets/mashuper_icons/icon_bass.png',
    color: '#1AB4AC',
    keywords: ['bass'],
    keys: ['']
  },
  {
    name: 'Drums',
    image: '/assets/mashuper_icons/icon_drums.webp',
    color: '#ef7a57',
    keywords: ['drum'],
    keys: ['']
  },
  {
    name: 'Chords',
    image: '/assets/mashuper_icons/icon_keys.png',
    color: '#0075bb',
    keywords: ['chord'],
    keys: ['']
  },
  {
    name: 'FX',
    image: '/assets/mashuper_icons/icon_sfx.png',
    color: '#ffde91',
    keywords: ['fx'],
    keys: ['']
  },
  {
    name: 'Guitar',
    image: '/assets/mashuper_icons/icon_guitar.png',
    color: '#d1b2d1',
    keywords: ['guitar'],
    keys: ['']
  },
  {
    name: 'Key',
    image: '/assets/mashuper_icons/icon_keys.png',
    color: '#c6ab98',
    keywords: ['piano'],
    keys: ['']
  },
  {
    name: 'Others',
    image: '/assets/mashuper_icons/icon_drums.png',
    color: '#B8C0C2',
    keywords: [''],
    keys: ['']
  },
  {
    name: 'Pads',
    image: '/assets/mashuper_icons/icon_pads.png',
    color: '#F9C7C6',
    keywords: ['pad'],
    keys: ['']
  },
  {
    name: 'Percussion',
    image: '/assets/mashuper_icons/icon_percussion.png',
    color: '#9ED6E7',
    keywords: ['perc'],
    keys: ['']
  },
  {
    name: 'Strings',
    image: '/assets/mashuper_icons/icon_strings.png',
    color: '#FBBC5D',
    keywords: ['string'],
    keys: ['']
  },
  {
    name: 'Vocals',
    image: '/assets/mashuper_icons/icon_vocals.webp',
    color: '#956c58',
    keywords: ['vocal'],
    keys: ['']
  },
  {
    name: 'Brass',
    image: '/assets/mashuper_icons/icon_brass.png',
    color: '#5E60AA',
    keywords: ['brass'],
    keys: ['']
  }
])

const channelimages = ref([
  '/assets/mashuper_icons/icon_bass.png',
  '/assets/mashuper_icons/icon_drums.webp',
  '/assets/mashuper_icons/icon_keys.png',
  '/assets/mashuper_icons/icon_sfx.png',
  '/assets/mashuper_icons/icon_guitar.png',
  '/assets/mashuper_icons/icon_drums.png',
  '/assets/mashuper_icons/icon_pads.png',
  '/assets/mashuper_icons/icon_percussion.png',
  '/assets/mashuper_icons/icon_strings.png',
  '/assets/mashuper_icons/icon_vocals.webp',
  '/assets/mashuper_icons/icon_brass.png'
])

const getSoundTypeByName = (name) => {
  return soundTypes.value.find((soundType) => soundType.name === name)
}

onMounted(() => {
  const BASE_API_URL = import.meta.env.VITE_API_URL

  collection.id = props.collectionId

  window.addEventListener('keydown', keydownHandler)

  audioPlayer().then((api) => {
    audioPlayerAPI = api
    startup()
  })
  isOpen.value = true
})

onBeforeUnmount(async () => {
  isOpen.value = false
  if (audioPlayerAPI && isPlaying.value) {
    await togglePlayback()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', keydownHandler)
})

async function startup() {
  await getScenesFromServer()

  if (audioPlayerAPI) {
    await audioPlayerAPI.removeAllTracks()

    if (scenes.scenesDB.length !== 0) {
      loadScene(0, false)
    } else {
      scenes.currentScene = scenes.scenesDB[0]
      addChannel(getSoundTypeByName('Others'), false)
      const channelsCopy = JSON.parse(JSON.stringify(lib.channels))
      scenes.scenesDB.push({
        name: 'My Scene',
        author: 'username',
        date: getCurrentDate(),
        tempo: '120',
        channels: channelsCopy
      })

      const scene = scenes.scenesDB[0]
      scenes.currentScene = scene
    }
    sceneName.value = scenes.currentScene.name
  }
}

const keydownHandler = (event) => {
  const keyNumber = parseInt(event.key, 10)
  if ((keyNumber >= 1 && keyNumber <= 9) || event.key === '0') {
    const channel = event.key === '0' ? 10 : keyNumber
  } else if (event.code === 'Space') {
    // togglePlayback()
  } else if (event.key.toUpperCase() === 'N') {
    // generate()
  }
}

const currentSceneIndex = computed(() => {
  if (scenes.currentScene) {
    const i = scenes.scenesDB.findIndex((scene) => scene.id === scenes.currentScene.id)
    return i + 1
  }
  return 0
})

const playbackButtonText = computed(() => {
  return isPlaying.value ? 0 : 1
})

const numbers = computed(() => {
  const min = 10
  const max = 200
  const numbers = []
  for (let i = min; i <= max; i++) {
    numbers.push(i)
  }
  return numbers
})

function shortenedText(text, maxlength) {
  if (text && text.length > maxlength) {
    return text.substring(0, maxlength) + '...'
  }
  return text
}

async function mute(index) {
  await audioPlayerAPI.mute(index)
  const track = lib.channels[index]
  if (!track.settings.mute) {
    track.settings.mute = true
  }
}

async function unMute(index) {
  await audioPlayerAPI.unMute(index)
  const track = lib.channels[index]
  if (track.settings.mute) {
    track.settings.mute = false
  }
}

const solo = (track, index) => {
  audioPlayerAPI.toggleSolo(index)

  if (track.settings.mute === false) {
    // check if already was solo
    let isAloneUnmuted = true
    lib.channels.forEach((channel, i) => {
      if (i !== index && !(channel.settings.mute)) {
        isAloneUnmuted = false
      }
    })
    // flip if already was solo
    if (isAloneUnmuted) {
      lib.channels.forEach((channel, i) => {
        channel.settings.mute = false
      })
      return
    }
  }
  // set channel to solo
  lib.channels.forEach((channel) => {
    channel.settings.mute = true
  })
  track.settings.mute = false
}

const setVolume = (index, volume) => {
  lib.channels[index].settings.volume = volume
  audioPlayerAPI.setVolume(index, volume)
}

async function removeTrack(index) {
  lib.channels.splice(index, 1)
  audioPlayerAPI.removeTrack(index)
}

function setChords() {
  for (let i = 0; i < lib.channels.length; i++) {
    const keyfilter = ['C', 'G', 'D', 'A', 'E']
    lib.channels[i].type.keys = keyfilter
  }
}

async function getTrack(track) {
  const sessionStore = useSessionStore()
  let filter = []

  if (track) {
    const keywords = track.type.keywords.join(',')
    filter.push('filters=' + keywords)
    // const keyfilter = ['C', 'G', 'D', 'A', 'E']
    // filter.push('key=' + keyfilter.join(','))
    filter.push('key=' + track.type.keys)
    filter.push('duration_min=1')
    filter.push('duration_max=16')

    if (scenes.currentScene) {
      const songbpm = scenes.currentScene.tempo
      filter.push('songbpm=' + songbpm)
    } else {
      filter.push('songbpm=120')
    }
    if (collection.id){
      filter.push('collection_id='+collection.id)
    }
  }

  try {
    const response = await fetch(
      BASE_API_URL + '/api/mashuper/randomfile?' + filter.join('&'),
      {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStore.getToken()}`
        }
      }
    )
    if (response.status !== 200) {
      throw new Error(response.statusText)
    }
    const data = await response.json()

    if (response.status !== 404) {
      const name = data.track_title
      let track_id
      let fileName
      if('track_id' in data && data.track_id !== undefined){
        track_id = data.track_id
        fileName = BASE_API_URL + '/api/mashuper/audio/' + track_id
      } else {
        // Initial check for the task status
        let taskStatus = 'started'
        let statusData = null
        while (isOpen.value === true && taskStatus !== 'finished') {
          const statusResponse = await fetch(
            BASE_API_URL + '/api/actions/' + data.task_id,
            {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${sessionStore.getToken()}`
              }
            }
          )
          statusData = await statusResponse.json()
          if (statusData.data) {
            taskStatus = statusData.data.status
          } else{
            throw new Error("Empty response")
          }
          // Optional: Add a delay to prevent hammering the server with requests
          if (taskStatus !== 'finished') {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        track_id = statusData.data.result
        fileName = BASE_API_URL + '/api/mashuper/audio/' + track_id
      }
      return { id: track_id, fileName: fileName, name: name }
    } else {
      useToast().error('No tracks found. Please import or generate some first.')
    }
  } catch (error) {
    useToast().error(`${error}`)
    return null
  }
}

async function addChannel(item, playback) {
  try {
    const channelId = uuidv4()
    let newtrack = {
      id: channelId,
      name: item.name,
      type: item,
      color: item.color,
      image: item.image,
      settings: { volume: '1', mute: false },
      track: {
        id: null,
        name: null,
        url: null
      }
    }

    lib.channels.push(newtrack)
    let index = lib.channels.findIndex((channel) => channel.id === channelId)
    lib.channels[index].loading = true
    lib.channels[index].loadingmusicgen = false

    await delay(100)
    slotMachineRefs[lib.channels[index].id].start()

    const rndfile = await getTrack(lib.channels[index])

    if (rndfile) {
      index = lib.channels.findIndex((channel) => channel.id === channelId)

      lib.channels[index].track.id = rndfile.id
      lib.channels[index].track.name = rndfile.name
      lib.channels[index].track.url = rndfile.fileName

      await audioPlayerAPI.addTrack(rndfile.fileName)
      await audioPlayerAPI.replaceTrack(lib.channels.length - 1, rndfile.fileName)

      lib.channels[index].loading = false
    } else {
      // no sample found, remove the channel again
      let index = lib.channels.findIndex((channel) => channel.id === channelId)
      lib.channels.splice(index, 1)
    }
  } catch (error) {
    console.log('addChannel error', error)
  }
}

function getBrighterColor(hexColor, percent) {
  function parseColor(hexColor) {
    const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor)
    return parsed
      ? {
          r: parseInt(parsed[1], 16),
          g: parseInt(parsed[2], 16),
          b: parseInt(parsed[3], 16)
        }
      : null
  }

  function adjustBrightness(color, percent) {
    const { r, g, b } = color
    const adjustedR = Math.round(r + r * percent)
    const adjustedG = Math.round(g + g * percent)
    const adjustedB = Math.round(b + b * percent)
    return {
      r: clamp(adjustedR, 0, 255),
      g: clamp(adjustedG, 0, 255),
      b: clamp(adjustedB, 0, 255)
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function componentToHex(component) {
    const hex = component.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  function rgbToHex(r, g, b) {
    const hexR = componentToHex(r)
    const hexG = componentToHex(g)
    const hexB = componentToHex(b)
    return `#${hexR}${hexG}${hexB}`
  }

  const parsedColor = parseColor(hexColor)
  const adjustedColor = adjustBrightness(parsedColor, percent)
  const brighterHexColor = rgbToHex(adjustedColor.r, adjustedColor.g, adjustedColor.b)
  return brighterHexColor
}

async function generateTrack(channelId) {
  // if (audioPlayerAPI && !isPlaying.value) {
  //   await togglePlayback()
  // }

  let index = lib.channels.findIndex((channel) => channel.id === channelId)

  try {
    lib.channels[index].loading = true

    slotMachineRefs[lib.channels[index].id].start()

    let rndfile = await getTrack(lib.channels[index])

    if (rndfile) {
      lib.channels[index].track.id = rndfile.id
      lib.channels[index].track.name = rndfile.name
      lib.channels[index].track.url = rndfile.fileName

      await audioPlayerAPI.replaceTrack(index, rndfile.fileName)
      await audioPlayerAPI.setVolume(index, lib.channels[index].settings.volume)
      if (lib.channels[index].settings.mute) {
        await mute(index)
      }
      if (lib.channels[index].settings.solo) {
        await audioPlayerAPI.toggleSolo(index)
      }

      const originalcolor = lib.channels[index].color
      lib.channels[index].color = getBrighterColor(originalcolor, 0.5)
      setTimeout(function () {
        lib.channels[index].color = originalcolor
      }, 100)
    }

    slotMachineRefs[lib.channels[index].id].stop()
  } catch (error) {
    console.log('generateTrack error:', error)
  }
  lib.channels[index].loading = false
}

async function generate() {
  for (let i = 0; i < lib.channels.length; i++) {
    generateTrack(lib.channels[i].id)
  }
}

async function downloadScene() {
  const browserStore = useBrowserStore()
  const tracks = []
  for (let i = 0; i < lib.channels.length; i++) {
    tracks.push(lib.channels[i].track)
  }
  browserStore.export.tracks = tracks
  browserStore.export.filename = sceneName.value
  exporterShow.value = true
}

async function togglePlayback() {
  if (audioPlayerAPI) {
    audioPlayerAPI.toggleAllTracks()
  }
  isPlaying.value = !isPlaying.value
}

function toggleScenes() {
  scenesBrowser.value = !scenesBrowser.value
}

async function loadScene(index, playback = true) {
  if (!audioPlayerAPI && playback) {
    await togglePlayback()
  }
  const scene = scenes.scenesDB[index]
  scenes.currentScene = scene
  sceneName.value = scenes.currentScene.name

  const initalLen = lib.channels.length

  for (let index = 0; index < scene.channels.length; index++) {
    // legacy scene DB hack: add an ID if none present in DB results
    if (!scene.channels[index].id) {
      scene.channels[index].id = uuidv4()
    }

    const url = scene.channels[index].track.url

    if (index < initalLen) {
      lib.channels[index] = scene.channels[index]
      lib.channels[index].loading = true
      await audioPlayerAPI.replaceTrack(index, url)
      await audioPlayerAPI.setVolume(index, scene.channels[index].settings.volume)
      if (lib.channels[index].settings.mute) {
        await mute(index)
      }
      if (lib.channels[index].settings.solo) {
        await audioPlayerAPI.toggleSolo(index)
      }
    } else {
      lib.channels.push(scene.channels[index])
      await audioPlayerAPI.addTrack(url)
      lib.channels[index].loading = true

      // HACK: possibly redudant: done to keep sync
      // await delay(200)
      await audioPlayerAPI.replaceTrack(index, url)

      await audioPlayerAPI.setVolume(index, scene.channels[index].settings.volume)
      if (lib.channels[index].settings.mute) {
        await mute(index)
      }
      if (lib.channels[index].settings.solo) {
        await audioPlayerAPI.toggleSolo(index)
      }
    }
    lib.channels[index].loading = false
  }

  while (lib.channels.length > scene.channels.length) {
    let index = lib.channels.length - 1
    lib.channels.pop()
    await removeTrack(index)
  }
}

const handleTempoSelect = async (newTempo) => {
  // TODO fix: this creates one request per channel which is going to spam the server
  const sessionStore = useSessionStore()
  for (let index = 0; index < lib.channels.length; index++) {
    try {
      const track_id = lib.channels[index].track.id
      const response = await fetch(
        BASE_API_URL + `/api/mashuper/quantize/${track_id}?songbpm=${scenes.currentScene.tempo}`,
        {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionStore.getToken()}`
          }
        }
      )
      if (response.status !== 200) {
        throw new Error(response.statusText)
      }
      const data = await response.json()

      if (response.status !== 404) {
        lib.channels.forEach((channel, i) => {
          channel.loading = true
        })
        const name = data.track_title
        let track_id
        let fileName
        if('track_id' in data && data.track_id !== undefined){
          track_id = data.track_id
          fileName = BASE_API_URL + '/api/mashuper/audio/' + track_id
        } else {
          // Initial check for the task status
          let taskStatus = 'started'
          let statusData = null
          while (isOpen.value === true && taskStatus !== 'finished') {
            const statusResponse = await fetch(
              BASE_API_URL + '/api/actions/' + data.task_id,
              {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStore.getToken()}`
                }
              }
            )
            statusData = await statusResponse.json()
            if (statusData.data) {
              taskStatus = statusData.data.status
            } else{
              throw new Error("Empty response")
            }
            // Optional: Add a delay to prevent hammering the server with requests
            if (taskStatus !== 'finished') {
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          }

          track_id = statusData.data.result
          fileName = BASE_API_URL + '/api/mashuper/audio/' + track_id
        }
        lib.channels[index].track.id = track_id
        lib.channels[index].track.name = name
        lib.channels[index].track.url = fileName
        await audioPlayerAPI.replaceTrack(index, fileName)
        lib.channels[index].loading = false
      } else {
        useToast().error('No tracks found. Please import or generate some first.')
      }
    } catch (error) {
      useToast().error(`${error}`)
      return null
    }
  }
}


//////////// Modal Menu Controls ////////////
const menus = reactive({
  track: {
    name: '',
    key: '',
    menuOpen: false,
    menuCurrentTrack: null
  },
  generator: {
    prompt: null,
    menuOpen: false,
    currentTrack: 0,
    newChannel: true
  }
})

const sceneName = ref('')
let sceneOverwrite = ref(false)
const sceneNameMenuOpen = ref(false)

function getCurrentDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const year = date.getFullYear();

    return month + '/' + day + '/' + year;
}

async function saveScene() {
  if (sceneOverwrite.value === false) {
    const channelsCopy = JSON.parse(JSON.stringify(lib.channels))
    scenes.scenesDB.push({
      name: sceneName.value,
      author: 'username',
      date: getCurrentDate(),
      tempo: `${scenes.currentScene.tempo}`,
      channels: channelsCopy
    })
  }
  saveSceneToServer()
  sceneNameMenuOpen.value = false
}

async function openTrackMenu(index) {
  menus.track.menuCurrentTrack = index
  menus.track.name = lib.channels[index].name
  menus.track.key = lib.channels[index].type.keys
  menus.track.menuOpen = true
}

async function saveSceneToServer() {
  const sessionStore = useSessionStore()
  if (sceneOverwrite.value === true) {
    let scene = scenes.currentScene
    scene.name = sceneName.value
    scene.channels = lib.channels
    // update existing scene
    fetch(
      BASE_API_URL + '/api/mashuper/scenes/' + scene.id,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStore.getToken()}`
        },
        body: JSON.stringify(scene)
      }
    )
  }
  else {
    // save new scene
    const scene = scenes.scenesDB[scenes.scenesDB.length - 1]
    fetch(
      BASE_API_URL + '/api/mashuper/scenes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStore.getToken()}`
        },
        body: JSON.stringify(scene)
      }
    )
    .then((response) => response.json())
    .then((data) => {
      scenes.scenesDB[scenes.scenesDB.length - 1].id = data.scene_id
    })
  }
}

async function getSceneFromServer(id) {
  // To load a scene
  const sessionStore = useSessionStore()
  fetch(
    BASE_API_URL + '/api/mashuper/scenes/' + id,
    {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStore.getToken()}`
      }
    },
  )
  .then((response) => response.json())
  .then((data) => {
    let scene = data
    // Do something with the scene...
  })
}

async function getScenesFromServer() {
  // To load all scenes
  const sessionStore = useSessionStore()
  await fetch(
    BASE_API_URL + '/api/mashuper/scenes',
    {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStore.getToken()}`
      }
    },
  )
  .then((response) => response.json())
  .then((data) => {
    scenes.scenesDB = data
  })
}

async function deleteSceneFromServer(scene_id, index) {
  const sessionStore = useSessionStore()
  fetch(
    BASE_API_URL + `/api/mashuper/scenes/${scene_id}`,
    {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStore.getToken()}`
      }
    },
    )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      scenes.scenesDB.splice(index, 1)
      return response.json()
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}

async function saveTrackOption() {
  if (menus.track.name.length >= 0) {
    lib.channels[menus.track.menuCurrentTrack].type.keywords = [menus.track.name]
    lib.channels[menus.track.menuCurrentTrack].name = menus.track.name
  }
  lib.channels[menus.track.menuCurrentTrack].type.keys = menus.track.key

  menus.track.menuOpen = false
  menus.track.name = ''
  menus.track.key = ''
}

async function openGeneratorMenu(channelId) {
  let index = lib.channels.findIndex((channel) => channel.id === channelId)

  if (lib.channels[index].loadingmusicgen) {
    return
  }

  menus.generator.menuOpen = true
  menus.generator.prompt = ''
  menus.generator.currentTrack = channelId
}

async function generatorMenuSave() {
  menus.generator.newChannel
  generateMusic(menus.generator.prompt, menus.generator.currentTrack, menus.generator.newChannel)
  menus.generator.menuOpen = false
  menus.generator.prompt = ''
}

function getFileNameAndExtension(url) {
  const filenameWithExtension = url.substring(url.lastIndexOf('/') + 1)
  const filename = filenameWithExtension.split('.')[0]
  const extension = filenameWithExtension.split('.').pop()
  const filenameAndExtension = `${filename}.${extension}`
  return filenameAndExtension
}

async function generateMusic(prompt, channelId, newChannel) {
  let index = lib.channels.findIndex((channel) => channel.id === channelId)

  if (lib.channels[index].loadingmusicgen) {
    return
  }
  try {
    lib.channels[index].loadingmusicgen = true
    // prompt + ' ' + scenes.currentScene.tempo + 'BPM, LOOP'
    const trackAudioFile = getFileNameAndExtension(lib.channels[index].track.url)

    const response = await fetch(BASE_API_URL + '/api/mashuper/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'melody',
        duration: 8,
        prompts: [prompt],
        generation_type: 'melody',
        melody_track_id: trackAudioFile,
        num_samples: 1
      })
    })

    if (!response.ok) {
      lib.channels[index].loadingmusicgen = false
      throw new Error('Response was not ok')
    } else {
      const data = await response.json()
      const gentrack = 'http://65.109.75.24/audio/'  + data.track_id // + data.filepaths[0]

      index = lib.channels.findIndex((channel) => channel.id === channelId)

      console.log('musicGen:', data, gentrack, newChannel)
      if (!newChannel) {
        lib.channels[index].track.name = prompt // data.filepaths[0]
        lib.channels[index].track.url = gentrack
        await audioPlayerAPI.replaceTrack(index, gentrack)
      } else {
        let newtrack = JSON.parse(JSON.stringify(lib.channels[index]))
        // lib.channels.push(newtrack)
        lib.channels.splice(index + 1, 0, newtrack)

        const addedtrack = lib.channels[index + 1]
        addedtrack.track.name = prompt // data.filepaths[0]
        addedtrack.track.url = gentrack
        addedtrack.loading = false
        addedtrack.id = uuidv4()
        addedtrack.loadingmusicgen = false
        await audioPlayerAPI.addTrack(gentrack, index + 1)
        await audioPlayerAPI.replaceTrack(index + 1, gentrack)
      }

      lib.channels[index].loadingmusicgen = false
      return data
    }
  } catch (err) {
    lib.channels[index].loadingmusicgen = false
    console.log('error', err.message)
    return err.message
  }
}

function handleRecordingComplete({ url, blob }) {
  console.log('The URL of the recorded file is', url, blob)
  audioPlayerAPI.replaceTrack(0, blob)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let scenesPlaying = reactive({ playing: false })

async function scenesPlay() {
  scenesPlaying.playing = !scenesPlaying.playing

  let i = 0
  if (scenes.currentScene) {
    i = scenes.scenesDB.findIndex((scene) => scene.id === scenes.currentScene.id)
  }

  while (scenesPlaying.playing) {
    if (isPlaying.value) {
      loadScene(i)
      if (scenes.currentScene) {
        i = scenes.scenesDB.findIndex((scene) => scene.id === scenes.currentScene.id)
      }
      i++
      if (i >= scenes.scenesDB.length) {
        i = 0
      }
    }
    // hack
    await delay(8000)
  }

  scenesPlaying.playing = false
}

const handleCollectionSelect = (collectionId, collectionName) => {
  collection.id = collectionId
  collection.name = collectionName
}
</script>

<template>
  <main>
    <modal :open="sceneNameMenuOpen" @update:open="sceneNameMenuOpen = $event" title="Save Scene">
      <div class="flex mt-4">
        <div class="font-bold">Name</div>
        <div class="ml-auto">
          <input type="checkbox" v-model="sceneOverwrite" id="sceneoverwrite" />
          <label for="sceneoverwrite"> Overwrite current scene</label>
        </div>
      </div>
      <div>
        <input
          v-focus
          v-model="sceneName"
          placeholder="Scene Name"
          class="border rounded-md p-2 mt-2 w-full text-black"
          @keyup.enter="saveScene()"
        />
      </div>

      <button
        class="rounded-md bg-green-500 hover:bg-green-500hover p-2 px-8 font-bold mt-6"
        @click="saveScene()"
      >
        Save
      </button>
      <button
        class="ml-2 font-bold rounded-md py-2 pr-2 bg-green-500 text-white hover:bg-green-500hover hover:text-white active:bg-violet-700"
        @click="downloadScene()"
      >
        <font-awesome-icon :icon="['fas', 'download']" size="sm" class="mr-2 ml-2" />Download scene tracks
      </button>
    </modal>

    <Exporter :modalopen="exporterShow" @modalClosed="exporterShow = false"></Exporter>

    <modal
      :open="menus.generator.menuOpen"
      @update:open="menus.generator.menuOpen = $event"
      title="MusicGen"
    >
      <div>
        <input
          v-focus
          v-model="menus.generator.prompt"
          placeholder="Prompt"
          class="border rounded-md p-2 mt-4 w-full text-black"
          @keyup.enter="generatorMenuSave()"
        />
      </div>
      <div class="my-4">
        <input type="checkbox" id="newchannelcheckbox" v-model="menus.generator.newChannel" />
        <label for="newchannelcheckbox" class="ml-2">Create new channel</label>
      </div>
      <button class="rounded-md bg-green-500 p-2 px-4 font-bold mt-4" @click="generatorMenuSave()">
        Generate
      </button>
    </modal>

    <modal
      :open="menus.track.menuOpen"
      @update:open="menus.track.menuOpen = $event"
      title="Edit Channel"
    >
      <div class="mt-4">
        <div class="mb-2 font-bold">Keyword</div>
        <input
          v-focus
          v-model="menus.track.name"
          placeholder="Search Query"
          class="border rounded-md p-2 w-full text-black"
          @keyup.enter="saveTrackOption()"
        />
      </div>
      <div class="mt-4">
        <div class="mb-2 font-bold">Keys</div>
        <input
          v-model="menus.track.key"
          placeholder="Track Key Query"
          class="border rounded-md p-2 w-full text-black"
          @keyup.enter="saveTrackOption()"
        />
      </div>
      <button
        class="rounded-md bg-green-500 hover:bg-green-500hover p-2 px-8 font-bold mt-6"
        @click="saveTrackOption()"
      >
        Save
      </button>
    </modal>

    <div class="flex bg-gray-100">
      <div class="flex-grow">
        <div class="bg-white text-black dark:bg-ngreyblack dark:text-white">
            <div class="text-xl font-bold text-ngreenhover pb-3" >
                Mashuper
                <div class="float-right text-black dark:text-white hover:text-ngreenhover cursor-pointer" @click="emit('modalClosed')"><font-awesome-icon icon="x" /></div>
            </div>

            <div class="content-center grid">
            <div
              class="dark:text-white p-0 py-2 rounded-md flex"
              v-if="scenes.scenesDB && scenes.currentScene"
            >
              <button
                class="border-0 border-gray-500 bg-green-500 w-[85px] rounded-md text-white"
                @click="togglePlayback()"
              >
                <template v-if="playbackButtonText === 0"
                  ><font-awesome-icon icon="stop"
                /></template>
                <template v-if="playbackButtonText === 1"
                  ><font-awesome-icon icon="play"
                /></template>
              </button>

              <div class="flex ml-1 mr-auto gap-1">
                <div
                  class="rounded-md border-gray-700 border text-black dark:text-white px-4 pt-1.5 w-[250px] cursor-pointer"
                  @click="toggleScenes()"
                  v-if="scenes.scenesDB.length > 0"
                >
                  {{ shortenedText(scenes.currentScene.name, 12) }}
                  <div class="float-right">
                    <span class="ml-2 text-xs">
                      ({{ currentSceneIndex }}/{{ scenes.scenesDB.length }})
                    </span>
                    <font-awesome-icon
                      icon="chevron-up"
                      size="xs"
                      class="ml-2"
                      v-if="scenesBrowser"
                    />
                    <font-awesome-icon icon="chevron-down" size="xs" class="ml-2" v-else />
                  </div>
                </div>
                <!-- <div
                  class="border border-gray-700 px-4 pt-3 rounded-md cursor-pointer text-xs inline-block"
                  @click="scenesPlay()"
                >
                  <template v-if="!scenesPlaying.playing"
                    ><font-awesome-icon icon="repeat"
                  /></template>
                  <template v-if="scenesPlaying.playing"
                    ><font-awesome-icon icon="arrow-right"
                  /></template>
                </div> -->
                <div
                  class="rounded-md bg-npurple text-white px-4 pt-2 text-center cursor-pointer"
                  @click="sceneNameMenuOpen = true"
                >
                  Save
                </div>
              </div>

              <div class="flex items-center h-10 ml-4" v-if="scenes.currentScene">
                <div class="mr-2">Tempo</div>
                <select
                  v-model="scenes.currentScene.tempo"
                  class="px-4 py-2 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-gray-500 bg-transparent"
                  @change="handleTempoSelect(event)"
                >
                  <option v-for="number in numbers" :key="number" :value="number">
                    {{ number }} BPM
                  </option>
                </select>
              </div>
              <div class="flex items-center h-10 ml-4" v-if="scenes.currentScene">
                <div class="mr-2">Assets</div>
                <CollectionPicker style="max-width: 12em;" @collection-select="handleCollectionSelect" :populate-id="props.collectionId"></CollectionPicker>
              </div>
              <button
                class="ml-2 font-bold rounded-md w-[165px] py-2 bg-green-500 text-white hover:bg-green-500hover hover:text-white active:bg-violet-700"
                @click="generate()"
              >
                <font-awesome-icon icon="arrows-rotate" size="xs" class="mr-2" />Regenerate
              </button>
            </div>
            <div
              v-if="scenesBrowser"
              class="text-white border border-gray-600 dark:bg-ngreyblack rounded-md px-4 pt-2 pb-4"
            >
              <div class="flex flex-wrap gap-2 mt-2">
                <draggable v-model="scenes.scenesDB" :item-key="'id'">
                  <template #item="{ element, index }">
                    <div
                        class="text-black dark:text-white"
                        :class="[
                            'border',
                            'border-gray-600',
                            'px-4',
                            'py-2',
                            'rounded-md',
                            'cursor-pointer',
                            'hover:bg-gray-600',
                            'text-xs',
                            'inline-block',
                            'm-1',
                            {
                            'bg-green-500': element.id === scenes.currentScene.id
                            }
                        ]"
                        @click="loadScene(index)"
                    >
                      <span class="float-left">{{ index + 1 }}. {{ element.name }}</span>
                      <span
                          class="float-right ml-2 font-semibold hover:text-black"
                          v-if="element.id !== undefined"
                          @click.stop="
                              deleteSceneFromServer(element.id, index)
                          "
                      >X</span>
                    </div>
                  </template>
                </draggable>
              </div>
            </div>
            <div
              class="flex gap-1 mt-1 content-middle h-[85px] text-black"
              v-for="(track, index) in lib.channels"
              :key="index"
              :class="{
                'opacity-40':
                  track.settings.mute
              }"
              @click="unMute(index)"
            >
              <div
                class="relative bg-cover bg-center min-w-[85px] rounded-md cursor-pointer bg-gray-800 transition"
                :style="{
                  backgroundColor: track.color
                }"
                @click="openTrackMenu(index)"
              >
                <div class="absolute inset-0 rounded-md text-white text-center">
                  <img
                    :src="track.image"
                    width="60"
                    height="60"
                    class="mx-3 my-3"
                    v-if="!track.loading"
                  />
                  <SlotMachine
                    :ref="(ref) => (slotMachineRefs[track.id] = ref)"
                    :channelimages="channelimages"
                    :channelimage="track.image"
                    class="opacity-0 rounded-md"
                    :class="{
                      'opacity-100': track.loading
                    }"
                  />
                </div>
                <div
                  class="absolute inset-0 bg-black rounded-md opacity-0 hover:opacity-60 text-white transition-opacity duration-0 text-center"
                >
                  <font-awesome-icon icon="plus" size="lg" class="mt-8 mx-auto" />
                </div>
              </div>

              <div
                class="relative rounded-md w-full cursor-pointer transition"
                :style="{ backgroundColor: track.color }"
              >
                <div class="p-5">
                  <div class="font-semibold">{{ track.name }}</div>
                  <div
                    class="text-xs"
                    :style="{
                      maxWidth: '500px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }"
                  >
                    {{ track.track.name }}
                  </div>

                  <div
                    class="absolute inset-0 rounded-md bg-black opacity-0 hover:opacity-100 flex transition"
                    :style="{ backgroundColor: track.color }"
                    :class="{
                      hidden:
                        track.settings.mute
                    }"
                  >
                    <div class="mr-auto">
                      <div class="font-semibold p-5 pb-0">
                        {{ track.name }}
                      </div>
                      <div class="flex ml-5">
                        <div class="mr-4">
                          <font-awesome-icon icon="volume-down" size="xs" />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          :value="track.settings.volume"
                          @input="setVolume(index, $event.target.value)"
                          style="width: 180px"
                        />
                      </div>
                    </div>
                    <div
                      class="border-l border-ngreyoverlay w-[85px] text-center hover:bg-ngreyoverlay pt-8 font-bold"
                      @click.stop="mute(index)"
                    >
                      M
                    </div>
                    <div
                      class="border-l border-ngreyoverlay w-[85px] text-center hover:bg-ngreyoverlay pt-8 font-bold"
                      @click.stop="solo(track, index)"
                    >
                      S
                    </div>
                    <div
                      class="border-l border-ngreyoverlay w-[85px] text-center hover:bg-ngreyoverlay pt-8 font-bold"
                      @click="removeTrack(index)"
                    >
                      <font-awesome-icon icon="trash" />
                    </div>
                  </div>
                  <div
                    class="indicator absolute inset-0 bg-black opacity-20 flex pointer-events-none"
                    :style="{
                      backgroundColor: 'black',
                      width: indicatorWidths[index]
                    }"
                  ></div>
                </div>
              </div>
              <div
                class="rounded-md min-w-[85px] text-center align-middle relative cursor-pointer transition"
                :style="{ backgroundColor: track.color }"
                @click.stop="generateTrack(track.id)"
                v-if="!track.loading"
              >
                <font-awesome-icon
                  icon="arrows-rotate"
                  size="lg"
                  class="mt-8"
                />
                <div
                  class="absolute inset-0 bg-ngreyoverlay rounded-md opacity-0 hover:opacity-60 text-white"
                ></div>
              </div>
              <div
                class="rounded-md min-w-[85px] text-center align-middle relative transition"
                :style="{ backgroundColor: track.color }"
                v-else
              >
                  <img src="/assets/loading_spinner.webp" width="50" class="mt-4 ml-4" />
                  <div class="absolute inset-0 bg-ngreyoverlay rounded-md opacity-0 text-white"></div>
              </div>
              <!--<div
                class="rounded-md min-w-[85px] text-center align-middle relative cursor-pointer"
                :style="{ backgroundColor: track.color }"
                @click="openGeneratorMenu(track.id)"
              >
                <font-awesome-icon
                  icon="robot"
                  size="lg"
                  class="mt-8"
                  v-if="!track.loadingmusicgen"
                />
                <img v-else src="/assets/loading_spinner.webp" width="50" class="mt-4 ml-4" />

                <div
                  class="absolute inset-0 bg-ngreyoverlay rounded-md opacity-0 hover:opacity-60 text-white"
                ></div>
              </div>-->
              <!-- <audiorecorder
            class="min-w-[50px]"
            :style="{ backgroundColor: track.color }"
            @recording-complete="handleRecordingComplete"
          ></audiorecorder> -->
            </div>
            <div class="bg-gray-300 dark:bg-gray-800 text-black dark:text-white rounded-md mt-1">
              <div class="relative min-h-[75px] w-full rounded-md text-center">
                <div
                  class="absolute inset-0 dark:bg-white bg-gray-200 h-full opacity-0 hover:opacity-100 text-white text-center gap-2 p-2 px-10 rounded-md flex items-center justify-center flex-wrap"
                >
                  <div
                    class="border border-gray-500 px-2 rounded-md text-black text-md cursor-pointer hover:bg-green-500 hover:border-ngreen hover:text-gray-100 flex"
                    v-for="(item, index) in soundTypes"
                    :key="index"
                    @click="addChannel(item, true)"
                  >
                    <img :src="item.image" class="w-4 h-4 mt-1 mr-1" />
                    {{ item.name }}
                  </div>
                </div>
                <font-awesome-icon icon="plus" size="lg" class="mt-6 mr-2 mx-auto" />
                Add Channel
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
