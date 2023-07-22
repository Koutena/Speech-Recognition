<template>
  <component :is="props.tag">
    <slot />
    <hr />
    <div>
      {{ transcript }}
    </div>
  </component>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { t } from 'src/boot/i18n';
import { showDialog } from 'src/services/ui.services';
import { onBeforeRouteLeave } from 'vue-router';
import { toLowerCaseWithRemovePunctuations } from 'src/services/ui.services';
import { Language } from 'src/models/language.models';
import { RecordAction } from 'src/models/record.models';

const recognition = new window.webkitSpeechRecognition();
const transcript = ref<string>('');
const isRecording = ref<boolean>(false);
const isInCalculateResult = ref<boolean>(false);
const wantsToLeavePage = ref<boolean>(false);

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface Props {
  action: RecordAction;
  tag?: string;
  lang?: Language;
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span',
  lang: 'en-US',
});

const emits = defineEmits([
  'onResult',
  'onStopped',
  'onRecording',
  'onCalculateResult',
]);

function stop() {
  isRecording.value = false;
  isInCalculateResult.value = true;

  recognition.stop();
}

watch(
  () => props.action,
  async (newValue) => {
    if (newValue === 'start') {
      recognition.start();
    }

    if (newValue === 'stop') {
      stop();
    }
  }
);

watch(
  () => isRecording.value,
  async (newValue) => {
    emits('onRecording', newValue);
  }
);

watch(
  () => isInCalculateResult.value,
  async (newValue) => {
    emits('onCalculateResult', newValue);
  }
);

watch(
  () => props.lang,
  async (newValue) => {
    recognition.lang = newValue;
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  recognition.continuous = true;
  recognition.interimResults = true;

  if (!('webkitSpeechRecognition' in window)) {
    console.error(t('browserDoesNotSupportRecorder'));
  }

  recognition.onstart = () => {
    transcript.value = '';
    isRecording.value = true;
  };

  recognition.onend = () => {
    isInCalculateResult.value = false;

    if (transcript.value && wantsToLeavePage.value === false) {
      emits('onStopped', transcript.value);
    }
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    transcript.value = toLowerCaseWithRemovePunctuations(
      event.results[0][0].transcript
    );

    emits('onResult', transcript.value);
  };
});

onBeforeRouteLeave(async (to, from, next) => {
  if (isRecording.value === false && isInCalculateResult.value === false) {
    next();
  } else {
    wantsToLeavePage.value = await showDialog({
      message: t('areYouSureToLeavePage'),
      class: 'reverse-actions',
      ok: {
        label: t('yes'),
        color: 'primary',
      },
      cancel: {
        label: t('no'),
        color: 'secondary',
      },
      persistent: true,
    });

    if (wantsToLeavePage.value) {
      recognition.removeEventListener('end', recognition.onend);
      recognition.abort();
    }

    next(wantsToLeavePage.value);
  }
});
</script>
