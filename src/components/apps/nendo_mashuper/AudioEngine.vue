<script>
import { reactive } from 'vue'

export const indicatorWidths = reactive([])
export const audioEngineState = reactive({
  volume: 1,
  tracks: []
})
let audioContext = null
let globalGainNode = null

export async function initializeAudioContext() {
  if (!audioContext) {
    // Create the AudioContext only if it doesn't exist
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    globalGainNode = audioContext.createGain()
    globalGainNode.connect(audioContext.destination)
  }
}

// let compressor = audioContext.destination
// let compressor = audioContext.createDynamicsCompressor()
// compressor.connect(audioContext.destination)
// compressor.threshold.value = -50
// compressor.knee.value = 40
// compressor.ratio.value = 12
// compressor.attack.value = 0
// compressor.release.value = 0.25

export async function audioPlayer() {
  const tracks = []
  const trackStates = []

  async function addTrack(trackInput, insertIndex = null) {
    await initializeAudioContext()

    const arrayBuffer = await getInputArrayBuffer(trackInput)
    const buffer = await audioContext.decodeAudioData(arrayBuffer)

    const track = {
      buffer: buffer,
      state: {
        playing: false,
        paused: false,
        source: null,
        gainNode: null,
        mute: false,
        originalVolume: 1,
        currentTime: 0,
        totalTime: buffer.duration
      }
    }

    // Check if an index is specified and if it is valid
    if (insertIndex !== null && insertIndex >= 0 && insertIndex < tracks.length) {
      tracks.splice(insertIndex, 0, track)
      trackStates.splice(insertIndex, 0, track.state)
      indicatorWidths.splice(insertIndex, 0, '0%')
    } else {
      const index = tracks.length
      tracks.push(track)
      trackStates.push(track.state)
      indicatorWidths.push('0%')
    }

    // Clear the tracks array
    audioEngineState.tracks.splice(0)

    // Push new track states
    trackStates.forEach((trackState) => audioEngineState.tracks.push(trackState))
  }

  function removeTrack(index) {
    if (index >= 0 && index < tracks.length) {
      const track = tracks[index]
      if (track.state.source) {
        track.state.source.stop()
      }
      if (track.state.gainNode) {
        track.state.gainNode.disconnect()
      }
      tracks.splice(index, 1)
      trackStates.splice(index, 1)
      delete indicatorWidths[index]
    }
  }

  function removeAllTracks() {
    tracks.forEach((track) => {
      const state = track.state
      if (state.source) {
        state.source.disconnect()
        state.source.stop()
        state.source = null
      }
      if (state.gainNode) {
        state.gainNode.disconnect()
        state.gainNode = null
      }
    })

    tracks.length = 0
    trackStates.length = 0
    indicatorWidths.length = 0
  }

  // Your requirement makes sense for a synchronized multi-track playback system, especially when the tracks are looping.
  function checkSync(index, newTrackInput) {
    const currentTrackState = trackStates[index]
    const masterTrackState = trackStates[0] // Assuming track 0 is the master track

    const currentTime = audioContext.currentTime
    const currentTrackElapsedTime = currentTime - currentTrackState.startTime
    const masterTrackElapsedTime = currentTime - masterTrackState.startTime

    // Check if tracks are out of sync
    const syncThreshold = 0.01 // Choose a threshold value that suits your needs
    if (Math.abs(currentTrackElapsedTime - masterTrackElapsedTime) > syncThreshold) {
      console.log(`Track ${index} is out of sync with the master track. Retiming...`)
      // Here you could call the 'replaceTrack' function again to retime the track
      // replaceTrack(index, newTrackInput)
    }
    // else {
    //     console.log(`Track ${index} is in sync with the master track.`)
    // }
  }

  let replaceTrackPromise = null
  // let referenceTrack = null

  async function replaceTrack(index, newTrackInput, referenceTrackIndex = 0) {
    const replaceTrackJob = async () => {
      if (index >= 0 && index < tracks.length) {
        const currentTrack = tracks[index]
        let referenceTrack = tracks[referenceTrackIndex]

        if (index === 0 && tracks.length > 1) {
          referenceTrack = tracks[(referenceTrackIndex + 1) % tracks.length]
        }

        const arrayBuffer = await fetch(newTrackInput).then((response) => response.arrayBuffer())
        const buffer = await audioContext.decodeAudioData(arrayBuffer)

        if (buffer.duration === 0) {
          console.log('Buffer duration is 0. Cannot replace track.')
          return
        }

        if (currentTrack.buffer === buffer) {
          console.log('Same track, skipping replacement.')
          return
        }

        const state = trackStates[index]
        const referenceState = trackStates[referenceTrackIndex]

        const referenceCurrentTime = audioContext.currentTime
        let referenceElapsedTime = 0
        if (referenceState.playing) {
          referenceElapsedTime = referenceCurrentTime - referenceState.startTime
          referenceElapsedTime = referenceElapsedTime % referenceTrack.buffer.duration
        }

        // stop old track before replacing it
        if (state.playing) {
          state.source.stop(referenceCurrentTime + 0.1)
          state.gainNode.disconnect()
        }

        const newSource = createSource(buffer)
        const newGainNode = createGainNode()
        connectGainNode(newSource, newGainNode)

        newSource.loop = true
        newSource.loopStart = 0
        newSource.loopEnd = buffer.duration

        currentTrack.buffer = buffer
        state.source = newSource
        state.gainNode = newGainNode

        // start synchronized is reference track is playing
        if (referenceState.playing) {
          const desiredStartTime = referenceCurrentTime - referenceElapsedTime
          const audioParam = newSource.playbackRate
          audioParam.setValueAtTime(1, desiredStartTime)

          state.startTime = desiredStartTime
          state.totalTime = buffer.duration

          const validElapsedTime = Math.min(referenceElapsedTime, buffer.duration)

          const referenceCurrentTimeDelay = 0 // 0.1
          newSource.start(referenceCurrentTime + referenceCurrentTimeDelay, validElapsedTime)
          state.playing = true

          const progress = validElapsedTime / buffer.duration
          indicatorWidths[index] = `${progress * 100}%`
        }

        // const delayBeforeCheckingSync = 200 // 2 seconds
        // setTimeout(
        //     checkSync,
        //     delayBeforeCheckingSync,
        //     index,
        //     newTrackInput
        // )
      } else {
        console.log(`Track with index ${index} not found.`)
      }
    }

    replaceTrackPromise = replaceTrackPromise
      ? replaceTrackPromise
          .then(replaceTrackJob)
          .catch((error) => console.log(`Error in replaceTrack: ${error}`))
      : replaceTrackJob().catch((error) => console.log(`Error in replaceTrack: ${error}`))

    return replaceTrackPromise
  }

  async function getInputArrayBuffer(input) {
    // If you're using some session management system or state management
    // library to get the token, uncomment and modify the next line appropriately:
    // const sessionStore = useSessionStore();
    let arrayBuffer
    if (input instanceof Blob) {
      arrayBuffer = await input.arrayBuffer()
    } else if (typeof input === 'string') {
      // Set up your fetch headers. If you need to add an authorization token,
      // you can do it here.
      let headers = {}
      // Uncomment the next line if you need to pass the token:
      // headers['Authorization'] = `Bearer ${sessionStore.getToken()}`;
      const response = await fetch(input, { headers: headers })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      arrayBuffer = await response.arrayBuffer()
    } else {
      throw new Error('Invalid track input. Must be either a URL string or a Blob.')
    }
    return arrayBuffer
  }

  function createSource(buffer) {
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.loopStart = 0
    source.loopEnd = buffer.duration

    return source
  }

  function createGainNode() {
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 1
    gainNode.connect(globalGainNode) // connect to globalGainNode instead of the destination directly
    return gainNode
  }
  function connectGainNode(source, gainNode) {
    source.connect(gainNode)
    gainNode.connect(globalGainNode) // connect to globalGainNode
  }

  function setGlobalVolume(volume) {
    if (volume >= 0 && volume <= 1) {
      audioEngineState.volume = volume
      globalGainNode.gain.value = volume
    } else {
      console.log('Global volume must be between 0 and 1')
    }
  }

  function getTrackDuration(index) {
    if (index >= 0 && index < tracks.length) {
      return tracks[index].buffer.duration
    } else {
      throw new Error('Invalid track index')
    }
  }

  function toggleTrack(index) {
    const track = tracks[index]
    const state = trackStates[index]

    if (!state.playing) {
      state.source = createSource(track.buffer)
      state.gainNode = createGainNode()
      connectGainNode(state.source, state.gainNode)
      state.source.start(0, state.currentTime)
    } else {
      state.source.stop()
      state.currentTime = 0
    }

    state.playing = !state.playing
  }

  function applyState(index, smooth){
    const state = trackStates[index]
    const targetGain = state.mute ? 0 : state.originalVolume
    const currentTime = audioContext.currentTime
    const gainNode = state.gainNode

    if (smooth === true) {
      const timeConstant = 0.05 // Time constant for the exponential smoothing
      // Schedule an exponential smoothing of the gain value
      gainNode.gain.setTargetAtTime(targetGain, currentTime, timeConstant)
      // Update the state's gain value with the target value after the smoothing transition
      setTimeout(() => {
        state.gainNode.gain.value = targetGain
      }, timeConstant * 1000)
    } else {
      gainNode.gain.setValueAtTime(targetGain, currentTime)
    }
  }

  function mute(index) {
    const state = trackStates[index]
    // if muting, save original volume
    if (state.mute === false){
      state.originalVolume = state.gainNode.gain.value
    }
    state.mute = true
    if (state.playing) {
      applyState(index, false)
    }
  }

  function unMute(index) {
    const state = trackStates[index]
    state.mute = false
    // if unmuting, restore original volume
    if (state.mute === true){
      state.gainNode.gain.value = state.originalVolume
    }    
    if (state.playing) {
      applyState(index, true)
    }
  }

  function toggleSolo(index) {
    const state = trackStates[index]
    if (state.mute === false) {
      // check if already is solo
      let isAloneUnmuted = true
      trackStates.forEach((trackState, i) => {
        if (i !== index && !(trackState.mute)) {
          isAloneUnmuted = false
        }
      })
      // only flip if it already was solo
      if (isAloneUnmuted === true){
        trackStates.forEach((trackState, i) => {
          if (i !== index) {
            unMute(i)
          }
        })
        return
      }
    }
    // mute all other tracks and unmute self => solo
    trackStates.forEach((trackState, i) => {
      if (i !== index && trackState.mute === false) {
        mute(i)
      }
    })
    if (state.mute === true){
      unMute(index)
    }
  }

  function toggleAllTracks() {
    if (trackStates.every((state) => state.playing)) {
      stopAll()
    } else {
      startAll()
    }
  }

  function startAll() {
    const startAllTime = audioContext.currentTime

    tracks.forEach((track, index) => {
      // first, stop if already playing
      const state = trackStates[index]
      if (state.playing) {
        state.source.stop()
        state.source.disconnect()
        state.gainNode.disconnect()
      }
      state.source = createSource(track.buffer)
      state.gainNode = createGainNode()
      connectGainNode(state.source, state.gainNode)

      state.startTime = startAllTime // Record the time when startAll() was called
      state.playing = false

      indicatorWidths[index] = '0%'
      // finally, start
      if (!state.playing) {
        state.source.start(startAllTime)
        state.startAllTime = startAllTime // Store the startAllTime in state
        state.playing = true
      }
      applyState(index, true)
    })

    updateCurrentTime()
  }

  function startTrack(index) {
    const startAllTime = audioContext.currentTime
    const track = tracks[index]
    const state = trackStates[index]

    if (state.playing) {
      state.source.stop()
      state.source.disconnect()
      if (state.gainNode) {
        state.gainNode.disconnect()
      }
    }
    state.source = createSource(track.buffer)
    if (!state.gainNode) {
      state.gainNode = createGainNode()
    }
    connectGainNode(state.source, state.gainNode)

    state.startTime = startAllTime // Record the time when startAll() was called
    state.playing = false

    indicatorWidths[index] = '0%'

    if (!state.playing) {
      state.source.start(startAllTime)
      state.startAllTime = startAllTime // Store the startAllTime in state
      state.playing = true
    }

    updateCurrentTime()
  }

  function stopAll() {
    tracks.forEach((track, index) => {
      const state = trackStates[index]

      if (state.playing) {
        state.source.stop()
        state.currentTime = 0
        state.playing = false
      }
    })
  }

  function pauseTrack(index) {
    const state = trackStates[index]

    if (state.playing) {
      // Store the current time before stopping the source
      state.currentTime = state.source.context.currentTime - state.startTime
      state.source.stop()
      state.paused = true
      state.playing = false
    }
  }

  function unpauseTrack(index) {
    const state = trackStates[index]

    if (state.paused) {
      state.source = createSource(tracks[index].buffer)
      state.gainNode = createGainNode()
      connectGainNode(state.source, state.gainNode)
      state.source.start(0, state.currentTime)
      state.startTime = state.source.context.currentTime - state.currentTime
      state.paused = false
      state.playing = true
    }
  }

  function setVolume(index, volume) {
    if (index >= 0 && index < trackStates.length) {
      const state = trackStates[index]
      if (!state.gainNode) {
        state.gainNode = createGainNode()
      }
      if (volume >= 0 && volume <= 1) {
        state.gainNode.gain.value = volume
        state.originalVolume = volume
      } else {
        console.log('Volume must be between 0 and 1')
      }
    } else {
      console.log('Invalid track index')
    }
  }

  function seekTrack(index, startTime) {
    const track = tracks[index]
    const state = trackStates[index]
    if (!state.source) {
      console.log('Cannot seek on a track that has not been started.')
      return
    }

    // Stop the current source
    if (state.playing) {
      state.source.stop()
    }

    // Create a new source for the same buffer
    state.source = createSource(track.buffer)

    // Set the current time
    state.currentTime = Math.min(startTime, track.buffer.duration)

    // Connect to the gain node
    connectGainNode(state.source, state.gainNode)

    // Start the source at the given time
    state.source.start(0, state.currentTime)

    // Record the actual start time, considering the offset
    state.startTime = audioContext.currentTime - state.currentTime

    // Set the playing flag
    // state.playing = true

    // Update the progress indicator
    const progress = state.currentTime / track.buffer.duration
    indicatorWidths[index] = `${progress * 100}%`

    updateCurrentTime()
  }

  function getTrackState(index) {
    return trackStates[index]
  }

  function getTrackStates() {
    return trackStates
  }

  function updateCurrentTime() {
    tracks.forEach((track, index) => {
      const state = trackStates[index]
      if (state.playing) {
        const elapsedTime = (audioContext.currentTime - state.startTime) % track.buffer.duration
        const progress = elapsedTime / track.buffer.duration
        indicatorWidths[index] = `${progress * 100}%`

        // Update state.currentTime
        state.currentTime = elapsedTime
      } else {
        indicatorWidths[index] = '0%'
      }
    })
    // Clear the tracks array
    audioEngineState.tracks.splice(0)

    // Push new track states
    trackStates.forEach((trackState) => audioEngineState.tracks.push(trackState))

    requestAnimationFrame(updateCurrentTime)
  }

  updateCurrentTime()

  return {
    addTrack,
    replaceTrack,
    removeTrack,
    removeAllTracks,
    toggleTrack,
    mute,
    unMute,
    toggleSolo,
    toggleAllTracks,
    startAll,
    startTrack,
    seekTrack,
    stopAll,
    setVolume,
    getTrackState,
    getTrackStates,
    getTrackDuration,
    pauseTrack,
    unpauseTrack,
    setGlobalVolume,
    audioEngineState,
    indicatorWidths
  }
}
</script>
