<script setup>
import {   onMounted, onUnmounted, ref } from 'vue'
import { debounce } from 'lodash'

// TODO:
// popdown windows when at corner of browser overlap: fix placement
// integrate the "similarity search" UI into the filterbar
// z-index issues with drop downs VS fields
// save filter settings in browser store per view (collections, etc)

const props = defineProps({
    filtersettings: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['updateFilters'])
const showMenu = ref(false)
const selection = ref('Exact')
const searchText = ref('')

onMounted(() => {
    document.addEventListener('click', onClickOutside);
})

onUnmounted(() => {
    document.removeEventListener('click', onClickOutside);
})

const onClickOutside = (event) => {
    let targetElement = event.target
    let isInsideDropdown = false

    while (targetElement != null) {
        if (targetElement.classList.contains('dropdown')) {
            isInsideDropdown = true
            break
        }
        targetElement = targetElement.parentElement
    }

    if (!isInsideDropdown) {
        showMenu.value = null
    }
}

function filterAdd() {
    const moods = [
        'action', 'adventure', 'advertising', 'background', 'ballad', 'calm', 'children', 'christmas', 'commercial', 'cool',
        'corporate', 'dark', 'deep', 'documentary', 'drama', 'dramatic', 'dream', 'emotional', 'energetic', 'epic', 'fast',
        'film', 'fun', 'funny', 'game', 'groovy', 'happy', 'heavy', 'holiday', 'hopeful', 'inspiring', 'love', 'meditative',
        'melancholic', 'melodic', 'motivational', 'movie', 'nature', 'party', 'positive', 'powerful', 'relaxing', 'retro',
        'romantic', 'sad', 'sexy', 'slow', 'soft', 'soundscape', 'space', 'sport', 'summer', 'trailer', 'travel', 'upbeat',
        'uplifting'
    ]

    const instrument = ['accordion', 'acousticbassguitar', 'acousticguitar', 'bass', 'beat', 'bell', 'bongo', 'brass', 'cello', 'clarinet', 'classicalguitar', 'computer', 'doublebass', 'drummachine', 'drums', 'electricguitar', 'electricpiano', 'flute', 'guitar', 'harmonica', 'harp', 'horn', 'keyboard', 'oboe', 'orchestra', 'organ', 'pad', 'percussion', 'piano', 'pipeorgan', 'rhodes', 'sampler', 'saxophone', 'strings', 'synthesizer', 'trombone', 'trumpet', 'viola', 'violin', 'voice']

    const genres = ["Blues", "Boogie Woogie", "Chicago Blues", "Country Blues", "Delta Blues", "Electric Blues", "Harmonica Blues", "Jump Blues", "Louisiana Blues", "Modern Electric Blues", "Piano Blues", "Rhythm & Blues", "Texas Blues", "Brass & Military", "Brass Band", "Marches", "Military", "Children's", "Educational", "Nursery Rhymes", "Story", "Classical", "Baroque", "Choral", "Classical", "Contemporary", "Impressionist", "Medieval", "Modern", "Neo-Classical", "Neo-Romantic", "Opera", "Post-Modern", "Renaissance", "Romantic", "Electronic", "Abstract", "Acid", "Acid House", "Acid Jazz", "Ambient", "Bassline", "Beatdown", "Berlin-School", "Big Beat", "Bleep", "Breakbeat", "Breakcore", "Breaks", "Broken Beat", "Chillwave", "Chiptune", "Dance-pop", "Dark Ambient", "Darkwave", "Deep House", "Deep Techno", "Disco", "Disco Polo", "Donk", "Downtempo", "Drone", "Drum n Bass", "Dub", "Dub Techno", "Dubstep", "Dungeon Synth", "EBM", "Electro", "Electro House", "Electroclash", "Euro House", "Euro-Disco", "Eurobeat", "Eurodance", "Experimental", "Freestyle", "Future Jazz", "Gabber", "Garage House", "Ghetto", "Ghetto House", "Glitch", "Goa Trance", "Grime", "Halftime", "Hands Up", "Happy Hardcore", "Hard House", "Hard Techno", "Hard Trance", "Hardcore", "Hardstyle", "Hi NRG", "Hip Hop", "Hip-House", "House", "IDM", "Illbient", "Industrial", "Italo House", "Italo-Disco", "Italodance", "Jazzdance", "Juke", "Jumpstyle", "Jungle", "Latin", "Leftfield", "Makina", "Minimal", "Minimal Techno", "Modern Classical", "Musique Concrète", "Neofolk", "New Age", "New Beat", "New Wave", "Noise", "Nu-Disco", "Power Electronics", "Progressive Breaks", "Progressive House", "Progressive Trance", "Psy-Trance", "Rhythmic Noise", "Schranz", "Sound Collage", "Speed Garage", "Speedcore", "Synth-pop", "Synthwave", "Tech House", "Tech Trance", "Techno", "Trance", "Tribal", "Tribal House", "Trip Hop", "Tropical House", "UK Garage", "Vaporwave", "Folk World & Country", "African", "Bluegrass", "Cajun", "Canzone Napoletana", "Catalan Music", "Celtic", "Country", "Fado", "Flamenco", "Folk", "Gospel", "Highlife", "Hillbilly", "Hindustani", "Honky Tonk", "Indian Classical", "Laïkó", "Nordic", "Pacific", "Polka", "Raï", "Romani", "Soukous", "Séga", "Volksmusik", "Zouk", "Éntekhno", "Funk / Soul", "Afrobeat", "Boogie", "Contemporary R&B", "Disco", "Free Funk", "Funk", "Gospel", "Neo Soul", "New Jack Swing", "P.Funk", "Psychedelic", "Rhythm & Blues", "Soul", "Swingbeat", "UK Street Soul", "Hip Hop", "Bass Music", "Boom Bap", "Bounce", "Britcore", "Cloud Rap", "Conscious", "Crunk", "Cut-up/DJ", "DJ Battle Tool", "Electro", "G-Funk", "Gangsta", "Grime", "Hardcore Hip-Hop", "Horrorcore", "Instrumental", "Jazzy Hip-Hop", "Miami Bass", "Pop Rap", "Ragga HipHop", "RnB/Swing", "Screw", "Thug Rap", "Trap", "Trip Hop", "Turntablism", "Jazz", "Afro-Cuban Jazz", "Afrobeat", "Avant-garde Jazz", "Big Band", "Bop", "Bossa Nova", "Contemporary Jazz", "Cool Jazz", "Dixieland", "Easy Listening", "Free Improvisation", "Free Jazz", "Fusion", "Gypsy Jazz", "Hard Bop", "Jazz-Funk", "Jazz-Rock", "Latin Jazz", "Modal", "Post Bop", "Ragtime", "Smooth Jazz", "Soul-Jazz", "Space-Age", "Swing", "Latin", "Afro-Cuban", "Baião", "Batucada", "Beguine", "Bolero", "Boogaloo", "Bossanova", "Cha-Cha", "Charanga", "Compas", "Cubano", "Cumbia", "Descarga", "Forró", "Guaguancó", "Guajira", "Guaracha", "MPB", "Mambo", "Mariachi", "Merengue", "Norteño", "Nueva Cancion", "Pachanga", "Porro", "Ranchera", "Reggaeton", "Rumba", "Salsa", "Samba", "Son", "Son Montuno", "Tango", "Tejano", "Vallenato", "Non-Music", "Audiobook", "Comedy", "Dialogue", "Education", "Field Recording", "Interview", "Monolog", "Poetry", "Political", "Promotional", "Radioplay", "Religious", "Spoken Word", "Pop", "Ballad", "Bollywood", "Bubblegum", "Chanson", "City Pop", "Europop", "Indie Pop", "J-pop", "K-pop", "Kayōkyoku", "Light Music", "Music Hall", "Novelty", "Parody", "Schlager", "Vocal", "Reggae", "Calypso", "Dancehall", "Dub", "Lovers Rock", "Ragga", "Reggae", "Reggae-Pop", "Rocksteady", "Roots Reggae", "Ska", "Soca", "Rock", "AOR", "Acid Rock", "Acoustic", "Alternative Rock", "Arena Rock", "Art Rock", "Atmospheric Black Metal", "Avantgarde", "Beat", "Black Metal", "Blues Rock", "Brit Pop", "Classic Rock", "Coldwave", "Country Rock", "Crust", "Death Metal", "Deathcore", "Deathrock", "Depressive Black Metal", "Doo Wop", "Doom Metal", "Dream Pop", "Emo", "Ethereal", "Experimental", "Folk Metal", "Folk Rock", "Funeral Doom Metal", "Funk Metal", "Garage Rock", "Glam", "Goregrind", "Goth Rock", "Gothic Metal", "Grindcore", "Grunge", "Hard Rock", "Hardcore", "Heavy Metal", "Indie Rock", "Industrial", "Krautrock", "Lo-Fi", "Lounge", "Math Rock", "Melodic Death Metal", "Melodic Hardcore", "Metalcore", "Mod", "Neofolk", "New Wave", "No Wave", "Noise", "Noisecore", "Nu Metal", "Oi", "Parody", "Pop Punk", "Pop Rock", "Pornogrind", "Post Rock", "Post-Hardcore", "Post-Metal", "Post-Punk", "Power Metal", "Power Pop", "Power Violence", "Prog Rock", "Progressive Metal", "Psychedelic Rock", "Psychobilly", "Pub Rock", "Punk", "Rock & Roll", "Rockabilly", "Shoegaze", "Ska", "Sludge Metal", "Soft Rock", "Southern Rock", "Space Rock", "Speed Metal", "Stoner Rock", "Surf", "Symphonic Rock", "Technical Death Metal", "Thrash", "Twist", "Viking Metal", "Yé-Yé", "Musical", "Stage & Screen", "Score", "Soundtrack", "Theme"]

    const sfx = ["Speech", "Child speech, kid speaking", "Conversation", "Narration, monologue", "Babbling", "Speech synthesizer", "Shout", "Bellow", "Whoop", "Yell", "Children shouting", "Screaming", "Whispering", "Laughter", "Baby laughter", "Giggle", "Snicker", "Belly laugh", "Chuckle, chortle", "Crying, sobbing", "Baby cry, infant cry", "Whimper", "Wail, moan", "Sigh", "Singing", "Choir", "Yodeling", "Chant", "Mantra", "Child singing", "Synthetic singing", "Rapping", "Humming", "Groan", "Grunt", "Whistling", "Breathing", "Wheeze", "Snoring", "Gasp", "Pant", "Snort", "Cough", "Throat clearing", "Sneeze", "Sniff", "Run", "Shuffle", "Walk, footsteps", "Chewing, mastication", "Biting", "Gargling", "Stomach rumble", "Burping, eructation", "Hiccup", "Fart", "Hands", "Finger snapping", "Clapping", "Heart sounds, heartbeat", "Heart murmur", "Cheering", "Applause", "Chatter", "Crowd", "Hubbub, speech noise, speech babble", "Children playing", "Animal", "Domestic animals, pets", "Dog", "Bark", "Yip", "Howl", "Bow-wow", "Growling", "Whimper (dog)", "Cat", "Purr", "Meow", "Hiss", "Caterwaul", "Livestock, farm animals, working animals", "Horse", "Clip-clop", "Neigh, whinny", "Cattle, bovinae", "Moo", "Cowbell", "Pig", "Oink", "Goat", "Bleat", "Sheep", "Fowl", "Chicken, rooster", "Cluck", "Crowing, cock-a-doodle-doo", "Turkey", "Gobble", "Duck", "Quack", "Goose", "Honk", "Wild animals", "Roaring cats (lions, tigers)", "Roar", "Bird", "Bird vocalization, bird call, bird song", "Chirp, tweet", "Squawk", "Pigeon, dove", "Coo", "Crow", "Caw", "Owl", "Hoot", "Bird flight, flapping wings", "Canidae, dogs, wolves", "Rodents, rats, mice", "Mouse", "Patter", "Insect", "Cricket", "Mosquito", "Fly, housefly", "Buzz", "Bee, wasp, etc.", "Frog", "Croak", "Snake", "Rattle", "Whale vocalization", "Music", "Musical instrument", "Plucked string instrument", "Guitar", "Electric guitar", "Bass guitar", "Acoustic guitar", "Steel guitar, slide guitar", "Tapping (guitar technique)", "Strum", "Banjo", "Sitar", "Mandolin", "Zither", "Ukulele", "Keyboard (musical)", "Piano", "Electric piano", "Organ", "Electronic organ", "Hammond organ", "Synthesizer", "Sampler", "Harpsichord", "Percussion", "Drum kit", "Drum machine", "Drum", "Snare drum", "Rimshot", "Drum roll", "Bass drum", "Timpani", "Tabla", "Cymbal", "Hi-hat", "Wood block", "Tambourine", "Rattle (instrument)", "Maraca", "Gong", "Tubular bells", "Mallet percussion", "Marimba, xylophone", "Glockenspiel", "Vibraphone", "Steelpan", "Orchestra", "Brass instrument", "French horn", "Trumpet", "Trombone", "Bowed string instrument", "String section", "Violin, fiddle", "Pizzicato", "Cello", "Double bass", "Wind instrument, woodwind instrument", "Flute", "Saxophone", "Clarinet", "Harp", "Bell", "Church bell", "Jingle bell", "Bicycle bell", "Tuning fork", "Chime", "Wind chime", "Change ringing (campanology)", "Harmonica", "Accordion", "Bagpipes", "Didgeridoo", "Shofar", "Theremin", "Singing bowl", "Scratching (performance technique)", "Pop music", "Hip hop music", "Beatboxing", "Rock music", "Heavy metal", "Punk rock", "Grunge", "Progressive rock", "Rock and roll", "Psychedelic rock", "Rhythm and blues", "Soul music", "Reggae", "Country", "Swing music", "Bluegrass", "Funk", "Folk music", "Middle Eastern music", "Jazz", "Disco", "Classical music", "Opera", "Electronic music", "House music", "Techno", "Dubstep", "Drum and bass", "Electronica", "Electronic dance music", "Ambient music", "Trance music", "Music of Latin America", "Salsa music", "Flamenco", "Blues", "Music for children", "New-age music", "Vocal music", "A capella", "Music of Africa", "Afrobeat", "Christian music", "Gospel music", "Music of Asia", "Carnatic music", "Music of Bollywood", "Ska", "Traditional music", "Independent music", "Song", "Background music", "Theme music", "Jingle (music)", "Soundtrack music", "Lullaby", "Video game music", "Christmas music", "Dance music", "Wedding music", "Happy music", "Sad music", "Tender music", "Exciting music", "Angry music", "Scary music", "Wind", "Rustling leaves", "Wind noise (microphone)", "Thunderstorm", "Thunder", "Water", "Rain", "Raindrop", "Rain on surface", "Stream", "Waterfall", "Ocean", "Waves, surf", "Steam", "Gurgling", "Fire", "Crackle", "Vehicle", "Boat, Water vehicle", "Sailboat, sailing ship", "Rowboat, canoe, kayak", "Motorboat, speedboat", "Ship", "Motor vehicle (road)", "Car", "Vehicle horn, car horn, honking", "Toot", "Car alarm", "Power windows, electric windows", "Skidding", "Tire squeal", "Car passing by", "Race car, auto racing", "Truck", "Air brake", "Air horn, truck horn", "Reversing beeps", "Ice cream truck, ice cream van", "Bus", "Emergency vehicle", "Police car (siren)", "Ambulance (siren)", "Fire engine, fire truck (siren)", "Motorcycle", "Traffic noise, roadway noise", "Rail transport", "Train", "Train whistle", "Train horn", "Railroad car, train wagon", "Train wheels squealing", "Subway, metro, underground", "Aircraft", "Aircraft engine", "Jet engine", "Propeller, airscrew", "Helicopter", "Fixed-wing aircraft, airplane", "Bicycle", "Skateboard", "Engine", "Light engine (high frequency)", "Dental drill, dentist's drill", "Lawn mower", "Chainsaw", "Medium engine (mid frequency)", "Heavy engine (low frequency)", "Engine knocking", "Engine starting", "Idling", "Accelerating, revving, vroom", "Door", "Doorbell", "Ding-dong", "Sliding door", "Slam", "Knock", "Tap", "Squeak", "Cupboard open or close", "Drawer open or close", "Dishes, pots, and pans", "Cutlery, silverware", "Chopping (food)", "Frying (food)", "Microwave oven", "Blender", "Water tap, faucet", "Sink (filling or washing)", "Bathtub (filling or washing)", "Hair dryer", "Toilet flush", "Toothbrush", "Electric toothbrush", "Vacuum cleaner", "Zipper (clothing)", "Keys jangling", "Coin (dropping)", "Scissors", "Electric shaver, electric razor", "Shuffling cards", "Typing", "Typewriter", "Computer keyboard", "Writing", "Alarm", "Telephone", "Telephone bell ringing", "Ringtone", "Telephone dialing, DTMF", "Dial tone", "Busy signal", "Alarm clock", "Siren", "Civil defense siren", "Buzzer", "Smoke detector, smoke alarm", "Fire alarm", "Foghorn", "Whistle", "Steam whistle", "Mechanisms", "Ratchet, pawl", "Clock", "Tick", "Tick-tock", "Gears", "Pulleys", "Sewing machine", "Mechanical fan", "Air conditioning", "Cash register", "Printer", "Camera", "Single-lens reflex camera", "Tools", "Hammer", "Jackhammer", "Sawing", "Filing (rasp)", "Sanding", "Power tool", "Drill", "Explosion", "Gunshot, gunfire", "Machine gun", "Fusillade", "Artillery fire", "Cap gun", "Fireworks", "Firecracker", "Burst, pop", "Eruption", "Boom", "Wood", "Chop", "Splinter", "Crack", "Glass", "Chink, clink", "Shatter", "Liquid", "Splash, splatter", "Slosh", "Squish", "Drip", "Pour", "Trickle, dribble", "Gush", "Fill (with liquid)", "Spray", "Pump (liquid)", "Stir", "Boiling", "Sonar", "Arrow", "Whoosh, swoosh, swish", "Thump, thud", "Thunk", "Electronic tuner", "Effects unit", "Chorus effect", "Basketball bounce", "Bang", "Slap, smack", "Whack, thwack", "Smash, crash", "Breaking", "Bouncing", "Whip", "Flap", "Scratch", "Scrape", "Rub", "Roll", "Crushing", "Crumpling, crinkling", "Tearing", "Beep, bleep", "Ping", "Ding", "Clang", "Squeal", "Creak", "Rustle", "Whir", "Clatter", "Sizzle", "Clicking", "Clickety-clack", "Rumble", "Plop", "Jingle, tinkle", "Hum", "Zing", "Boing", "Crunch", "Silence", "Sine wave", "Harmonic", "Chirp tone", "Sound effect", "Pulse", "Inside, small room", "Inside, large room or hall", "Inside, public space", "Outside, urban or manmade", "Outside, rural or natural", "Reverberation", "Echo", "Noise", "Environmental noise", "Static", "Mains hum", "Distortion", "Sidetone", "Cacophony", "White noise", "Pink noise", "Throbbing", "Vibration", "Television", "Radio", "Field recording"]


    const newFilter = {
        'field': {
            'options': [
                { name: 'Tempo', key: 'tempo', value: 'tempo', type: 'range', value_min: '', value_max: '', value_sign: 'BPM', search: 'plugindata' },
                { name: 'Key', key: 'key', value: 'Key', type: 'key', value_scale: '', value_key: '', search: 'plugindata' },
                { name: 'Album', key: 'album', value: 'Album', type: 'string', search: 'metadata' },
                { name: 'Artist', key: 'artist', value: 'Artist', type: 'string', search: 'metadata' },
                { name: 'Duration', key: 'duration', value: 'Duration', type: 'range', value_min: '', value_max: '', value_sign: 'sec', search: 'plugindata' },
                { name: 'Instruments', key: 'instruments', value: 'instruments', type: 'multiselect', options: instrument, values: [], search: 'plugindata' },
                { name: 'Genres', key: 'genres', value: 'genres', type: 'multiselect', options: genres, values: [], search: 'plugindata' },
                { name: 'SFX', key: 'sfx', value: 'sfx', type: 'multiselect', options: sfx, values: [], search: 'plugindata' },
                { name: 'Mood', key: 'moods', value: 'moods', type: 'multiselect', options: moods, values: [], search: 'plugindata' },
                { name: 'Transcription', key: 'transcription', value: 'transcription', type: 'string', search: 'plugindata' },
                { name: 'Summary', key: 'summary', value: 'summary', type: 'string', search: 'plugindata' },
                { name: 'Sentiment', key: 'sentiment_analysis', value: 'sentiment_analysis', type: 'string', search: 'plugindata' },
                { name: 'Topics', key: 'topic_detection', value: 'topic_detection', type: 'string', search: 'plugindata' },
                { name: 'Caption', key: 'caption', value: 'caption', type: 'string', search: 'plugindata' }
            ],
            'value': {},
        },
        'query': {},
    }

    for (let i = 0; i < newFilter.field.options.length; i++) {
        const settings = props.filtersettings.findIndex(obj => obj.query.key === newFilter.field.options[i].key)
        if (settings === -1) {
            // assign default
            newFilter.field.value = JSON.parse(JSON.stringify(newFilter.field.options[i]))
            newFilter.query = JSON.parse(JSON.stringify(newFilter.field.options[i]))
            emit('updateFilters', [...props.filtersettings, newFilter])
            break
        }
    }

    showMenu.value = false
}

function filterRemove(index) {
    if (index > -1 && index < props.filtersettings.length) {
        const updatedFilters = [...props.filtersettings]
        updatedFilters.splice(index, 1)
        emit('updateFilters', updatedFilters)
    }
    showMenu.value = false
}

function setExactValue(filter, newValue) {
    filter.query.value_min = newValue;
    filter.query.value_max = newValue;
}

function isRangeValid(min, max) {
    return max >= min;
}

function toggleMenu(index) {
    searchText.value = ''
    if (showMenu.value === index) {
        showMenu.value = false
    } else {
        showMenu.value = index
    }
}

function updateFilterValue(filter, newValue) {
    const settings = filter.field.options.find(obj => obj.value === newValue)
    filter.field.value = settings;
    filter.query = JSON.parse(JSON.stringify(settings))
    filter.query.value = ''
    showMenu.value = false
}

function multiselectAddVal(filter, option) {
    const isInArray = filter.query.values.indexOf(option);
    if (isInArray === -1) {
        filter.query.values.push(option)
    } else {
        filter.query.values.splice(isInArray, 1)
    }
}

function multiselectIsSelected(filter, option) {
    const isInArray = filter.query.values.indexOf(option);
    if (isInArray === -1) {
        return false
    }
    return true
}

const handleSearchInput = debounce((event) => {
    searchText.value = event.target.value
}, 300)

function multiselectClear(filter) {
    filter.query.values = []
}

const getFilteredOptions = (filter) => {
    return filter.query.options.filter(option =>
        option.toLowerCase().includes(searchText.value.toLowerCase())
    )
}

const getFilteredKeyOptions = (filter) => {
    return filter.field.options
        .filter(option =>
            option.name.toLowerCase().includes(searchText.value.toLowerCase())
        )
        .filter(option =>
            !props.filtersettings.some(setting => setting.query.key === option.key)
        )
}
</script>
<template>
    <div class="flex flex-wrap gap-2 px-4 py-2 text-sm dark:border-b-[3px] dark:border-black items-center">
        <button class="bg-npurple text-white min-w-[38px] h-[38px] px-4 my-0.5 font-medium rounded-md" @click="filterAdd()">
            <font-awesome-icon icon="plus" />
            <span class="ml-2" v-if="props.filtersettings.length === 0">Add Filter</span>
        </button>
        <div
v-for="(filter, index) in props.filtersettings" :key="index"
            class="flex relative bg-gray-100 dark:bg-transparent dark:p-0.5 rounded-md">
            <div>
                <div
@click="toggleMenu(index + 'x')"
                    class="dropdown border border-r-0search dark:border-gray-800 h-full pt-2.5 px-4 rounded-l-md cursor-pointer bg-white dark:bg-[#232323] dark:text-white text-xs flex z-20">
                    {{ filter.field.value.name }}
                    <svg
:class="{ 'transform rotate-180': showMenu === index + 'x' }"
                        class="h-4 w-4 pointer-events-none ml-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <div
v-if="showMenu === index + 'x'"
                    class="dropdown mt-0.5 border dark:border-gray-800 rounded-md absolute bg-white dark:bg-black min-w-[150px] shadow-xl z-50">
                    <div
                        class="relative mx-4 my-3 rounded-md border dark:border-0 border-gray-300 overflow-hidden bg-white dark:bg-[rgba(255,255,255,0.1)]">
                        <input
type="search" v-focus v-model="searchText"
                            class="form-control relative flex-auto min-w-0 max-w-[93%] block w-full px-4 py-[6px] font-normal text-gray-700 dark:text-gray-200 bg-transparent bg-clip-padding border-0 m-0 focus:text-gray-700 focus:outline-none"
                            placeholder="Search" aria-label="Search" aria-describedby="button-addon2"
                            @input="handleSearchInput" @click.stop />
                        <span class="absolute top-1.5 right-4 pl-4">
                            <font-awesome-icon icon="magnifying-glass" class="cursor-pointer ml-2 text-gray-500" />
                        </span>
                    </div>
                    <div class="max-h-[60vh] overflow-scroll">
                        <div
v-for="(option, optionindex) in getFilteredKeyOptions(filter)" :key="optionindex"
                            class="px-4 py-2 cursor-pointer hover:bg-ngreytransparent"
                            @click="updateFilterValue(filter, option.value)">
                            {{ option.name }}
                        </div>
                    </div>
                    <hr class="mb-4 mt-2 dark:border-gray-800" />
                    <div class="px-4 pb-4">
                        <button
@click="toggleMenu(index + 'x')"
                            class="bg-npurple text-white p-1 px-4 rounded-md font-medium">Close</button>
                    </div>
                </div>
            </div>
            <template v-if="filter.field.value.type === 'range'">
                <div>
                    <div
@click="toggleMenu(index)"
                        class="dropdown border dark:border-gray-800 p-2 px-4 cursor-pointer bg-white dark:bg-black z-20">
                        <template v-if="filter.query.value_min !== '' && filter.query.value_max !== ''">
                            <template v-if="filter.query.value_min === filter.query.value_max">{{ filter.query.value_min
                            }}</template>
                            <template v-else>{{ filter.query.value_min }} - {{ filter.query.value_max }}</template>
                            {{ filter.query.value_sign }}
                        </template>
                        <template v-else>
                            <span class="text-gray-400">Select</span>
                        </template>
                    </div>
                    <div
v-if="showMenu === index"
                        class="dropdown mt-0.5 border dark:border-gray-800 rounded-md absolute bg-white dark:bg-black min-w-[320px] shadow-xl z-50">
                        <div class="flex items-center mb-2 h-[30px] p-4 pt-8">
                            <label class="cursor-pointer mr-4">
                                <input type="radio" value="Exact" v-model="selection" class="mr-2">
                                Exact
                            </label>
                            <template v-if="selection === 'Exact'">
                                <input
type="number" v-model="filter.query.value_min"
                                    @input="setExactValue(filter, $event.target.value)"
                                    class="text-xs border dark:border-gray-700 p-1 rounded bg-transparent w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                            </template>
                        </div>
                        <div class="flex items-center mb-4 h-[30px] px-4">
                            <label class="cursor-pointer mr-4">
                                <input type="radio" id="range" value="Range" v-model="selection" class="mr-2">
                                Range
                            </label>
                            <template v-if="selection === 'Range'">
                                <input
type="number" placeholder="min" v-model="filter.query.value_min"
                                    class="text-xs border dark:border-gray-700 p-1 rounded bg-transparent w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                                <div class="mx-1">-</div>
                                <input
type="number" placeholder="max" v-model="filter.query.value_max"
                                    class="text-xs border dark:border-gray-700 p-1 rounded bg-transparent w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                            </template>
                        </div>
                        <div
class="mx-4 text-gray-400 text-xs"
                            v-if="!isRangeValid(filter.query.value_min, filter.query.value_max)">Max must be greater than
                            min.</div>

                        <hr class="my-4 dark:border-gray-800" />
                        <div class="px-4 pb-4">
                            <button
@click="filter.query.value_min = '', filter.query.value_max = ''"
                                class="py-1 underline">Clear</button>
                            <button
@click="toggleMenu(index)"
                                class="bg-npurple text-white p-1 px-4 rounded-md font-medium float-right">Close</button>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else-if="filter.field.value.type === 'multiselect'">
                <div>
                    <div
@click="toggleMenu(index)"
                        class="dropdown border dark:border-gray-800 p-2 px-4 h-full cursor-pointer bg-white dark:bg-black z-20">
                        <template v-for="(option, optionindex) in filter.query.values.slice(0, 2)" :key="optionindex">
                            {{ option }}
                            <template v-if="optionindex === 0 && filter.query.values.length > 1">, </template>
                            <template v-else-if="optionindex === 1 && filter.query.values.length > 2"></template>
                        </template>
                        <template v-if="filter.query.values.length > 2">
                            (+{{ filter.query.values.length - 2 }})
                        </template>

                        <template v-if="filter.query.values.length === 0">
                            <span class="text-gray-400">Select</span>
                        </template>
                    </div>
                    <div
v-if="showMenu === index"
                        class="dropdown mt-0.5 border dark:border-gray-800 rounded-md absolute bg-white dark:bg-black min-w-[350px] shadow-xl z-50">
                        <div
                            class="relative mx-4 mt-3 rounded-md border dark:border-0 border-gray-300 overflow-hidden bg-white dark:bg-[rgba(255,255,255,0.1)]">
                            <input
type="search" v-focus v-model="searchText"
                                class="form-control relative flex-auto min-w-0 max-w-[93%] block w-full px-4 py-[6px] font-normal text-gray-700 dark:text-gray-200 bg-transparent bg-clip-padding border-0 m-0 focus:text-gray-700 focus:outline-none"
                                placeholder="Search" aria-label="Search" aria-describedby="button-addon2"
                                @input="handleSearchInput" @click.stop />
                            <span class="absolute top-1.5 right-4 pl-4">
                                <font-awesome-icon icon="magnifying-glass" class="cursor-pointer ml-2 text-gray-500" />
                            </span>
                        </div>
                        <div class="my-4 max-h-[60vh] overflow-scroll">
                            <div
v-for="(option, optionindex) in getFilteredOptions(filter)" :key="optionindex"
                                class="px-6 py-1 cursor-pointer hover:bg-ngreytransparent"
                                @click="multiselectAddVal(filter, option)">
                                <input
type="checkbox" :checked="multiselectIsSelected(filter, option)"
                                    class="form-checkbox h-4 w-4 mr-2 text-blue-600" />
                                {{ option }}
                            </div>
                        </div>
                        <hr class="mb-4 dark:border-gray-800" />
                        <div class="px-4 pb-4">
                            <button @click="multiselectClear(filter)" class="py-1 underline">Clear</button>
                            <button
@click="toggleMenu(index)"
                                class="bg-npurple text-white p-1 px-4 rounded-md font-medium float-right">Close</button>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else-if="filter.field.value.type === 'key'">
                <div>
                    <div
@click="toggleMenu(index)"
                        class="dropdown border dark:border-gray-800 p-2 px-4 h-full cursor-pointer bg-white dark:bg-black z-20">
                        <template v-if="filter.query.value_key !== ''">
                            {{ filter.query.value_key }}
                            {{ filter.query.value_scale }}
                        </template>
                        <template v-else>
                            <span class="text-gray-400">Select</span>
                        </template>
                    </div>
                    <div
v-if="showMenu === index"
                        class="dropdown mt-0.5 border dark:border-gray-800 rounded-md absolute bg-white dark:bg-black min-w-[300px] shadow-xl z-50">
                        <div class="max-h-[60vh] overflow-scroll">
                            <div class="px-4 pb-4">
                                <div class="flex gap-2 text-center mt-4">
                                    <div class="flex gap-2 ml-5 mr-10">
                                        <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                            :class="{ 'bg-npurple': filter.query.value_key === 'C#' }"
                                            @click="filter.query.value_key = 'C#'">C♯</div>
                                        <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                            :class="{ 'bg-npurple': filter.query.value_key === 'Eb' }"
                                            @click="filter.query.value_key = 'Eb'">E♭</div>
                                    </div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'F#' }"
                                        @click="filter.query.value_key = 'F#'">F♯</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'Ab' }"
                                        @click="filter.query.value_key = 'Ab'">A♭</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'Bb' }"
                                        @click="filter.query.value_key = 'Bb'">B♭</div>
                                </div>
                                <div class="flex gap-2 text-center mt-4">
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'C' }"
                                        @click="filter.query.value_key = 'C'">C</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'D' }"
                                        @click="filter.query.value_key = 'D'">D</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'E' }"
                                        @click="filter.query.value_key = 'E'">E</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'F' }"
                                        @click="filter.query.value_key = 'F'">F</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'G' }"
                                        @click="filter.query.value_key = 'G'">G</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'A' }"
                                        @click="filter.query.value_key = 'A'">A</div>
                                    <div
class="border dark:border-gray-700 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-600 w-[32px] h-[32px] pt-[5px]"
                                        :class="{ 'bg-npurple': filter.query.value_key === 'B' }"
                                        @click="filter.query.value_key = 'B'">B</div>
                                </div>
                                <div class="flex gap-2 text-center mt-4">
                                    <div
class="border dark:border-gray-700 rounded-md grow px-2 py-1 cursor-pointer"
                                        :class="{ 'bg-npurple': filter.query.value_scale === 'major' }"
                                        @click="filter.query.value_scale = 'major'">Major</div>
                                    <div
class="border dark:border-gray-700 rounded-md grow px-2 py-1 cursor-pointer"
                                        :class="{ 'bg-npurple': filter.query.value_scale === 'minor' }"
                                        @click="filter.query.value_scale = 'minor'">Minor</div>
                                </div>
                            </div>
                            <hr class="mb-4 dark:border-gray-800" />
                            <div class="px-4 pb-4">
                                <button
@click="filter.query.value_key = ''; filter.query.value_scale = ''"
                                    class="py-1 underline">Clear</button>
                                <button
@click="toggleMenu(index)"
                                    class="bg-npurple text-white p-1 px-4 rounded-md font-medium float-right">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                <div>
                    <input
type="text" autocomplete="search" v-model="filter.query.value" required
                        class="block w-full bg-white dark:bg-black text-gray-700 dark:text-gray-200 placeholder:text-gray-400 border dark:border-gray-800 p-2 px-4 focus:outline-none dark:focus:border-npurple focus:border-npurple"
                        placeholder="Query" />
                </div>
            </template>
            <button
                class="text-gray-500 dark:text-white dark:hover:text-npurple px-2 py-2.5 font-medium border border-l-0 dark:border-gray-800 rounded-r-md bg-ngreytransparent"
                @click="filterRemove(index)">
                <svg
xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="feather feather-x cursor-pointer rounded-full w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    </div>
</template>
