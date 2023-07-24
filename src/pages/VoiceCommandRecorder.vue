<template>
  <div class="q-pa-lg">
    <h6>Version: 3</h6>
    <hr />
    <div v-if="supportedRecorder">
      <q-btn-toggle
        v-model="lang"
        rounded
        unelevated
        size="sm"
        class="language"
        :options="[
          { label: $t('english'), value: 'en-US' },
          { label: $t('persian'), value: 'fa-IR' },
        ]"
      />

      <q-space class="q-mt-md" />

      <x-recorder
        v-model:action="action"
        :lang="lang"
        @on-recording="onRecording"
        @on-calculate-result="onCalculateResult"
        @on-result="onResult"
        @on-stopped="onStopped"
      >
        <q-spinner-hourglass
          v-if="isInCalculateResult"
          color="primary"
          size="sm"
        />
        <q-icon
          v-else
          name="mdi-microphone"
          size="sm"
          :color="isRecording ? 'negative' : 'primary'"
          class="cursor-pointer"
          @click="toggleRecord"
        >
          <q-tooltip>
            {{ isRecording ? $t('stop') : $t('start') }}
          </q-tooltip>
        </q-icon>
        {{ $t('sendCommand') }}
      </x-recorder>
    </div>
    <div v-else>
      {{ $t('browserDoesNotSupportRecorder') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { t } from 'src/boot/i18n';
import { showDialog } from 'src/services/ui.services';
import { Notify } from 'quasar';
import XRecorder from 'src/components/XRecorder.vue';
import { toLowerCaseWithRemovePunctuations } from 'src/services/ui.services';
import { Language } from 'src/models/language.models';
import { RecordAction, supportedRecorder } from 'src/models/record.models';

const lang = ref<Language>('en-US');
const action = ref<RecordAction>('stop');
const isRecording = ref<boolean>(false);
const isInCalculateResult = ref<boolean>(false);
const mockCommands = ref<{ id: number; text: string }[]>([
  { id: 1, text: 'Turn on the light.' },
  { id: 2, text: 'turn off the light' },
  { id: 3, text: 'چراغ را روشن کن' },
  { id: 4, text: 'چراغ را خاموش کن' },
]);

function toggleRecord() {
  if (action.value === 'start') {
    action.value = 'stop';
  } else {
    action.value = 'start';
  }
}

function onRecording(value: boolean) {
  isRecording.value = value;
}

function onCalculateResult(value: boolean) {
  isInCalculateResult.value = value;
}

async function onStopped(value: string) {
  if (
    await showDialog({
      message: t('areYourSureAboutSendingCommand', {
        value: value,
      }),
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
    })
  ) {
    const foundedCommand = mockCommands.value?.find(
      (c) => toLowerCaseWithRemovePunctuations(c.text) === value
    );
    if (foundedCommand) {
      Notify.create({
        type: 'positive',
        message: `${t('commandText')}: ${foundedCommand.text}`,
        progress: true,
      });
    } else {
      Notify.create({
        type: 'negative',
        message: t('commandIsNotValid'),
        progress: true,
      });
    }
  }
}

function onResult(value: string) {
  if (
    mockCommands.value?.some(
      (c) => toLowerCaseWithRemovePunctuations(c.text) === value
    )
  ) {
    action.value = 'stop';
  }
}
</script>

<style lang="scss" scoped>
.language {
  border: 1px solid $primary;
}
</style>
