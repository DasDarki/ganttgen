<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {Block, generate} from "./generate.ts";
import * as htmlToImage from 'html-to-image';
import { toPng } from 'html-to-image';

const fileUploader = ref<HTMLInputElement>();
const blocks = ref<Block[]>();
const pendelum = ref(false);

const columns = computed<{year: string, months: string[]}[]>(() => {
  if (!blocks.value) return [];
  const minDate = new Date(blocks.value!.reduce((acc, block) => Math.min(acc, block.start.getTime()), Infinity));
  minDate.setDate(1);
  const maxDate = new Date(blocks.value!.reduce((acc, block) => Math.max(acc, block.end.getTime()), -Infinity));
  maxDate.setDate(28);

  const columns: {year: string, months: string[]}[] = [];
  for (let year = minDate.getFullYear(); year <= maxDate.getFullYear(); year++) {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      if (date < minDate || date > maxDate) continue;
      months.push(date.toLocaleString('default', { month: 'long' }));
    }
    columns.push({year: year.toString(), months});
  }

  return columns;
});

const indexes = computed<{[key: string]: number}>(() => {
  const indexes: {[key: string]: number} = {};
  let index = 0;
  for (const col of columns.value) {
    for (const month of col.months) {
      indexes[`${col.year}-${month}`] = index++;
    }
  }

  return indexes;
});

function pendel(reset: boolean = false): boolean {
  if (reset) {
    pendelum.value = false;
    return false;
  }

  pendelum.value = !pendelum.value;
  return pendelum.value;
}

function getBlockOffset(block: Block): number {
  return indexes.value[`${block.start.getFullYear()}-${block.start.toLocaleString('default', { month: 'long' })}`];
}

function getBlockLength(block: Block): number {
  const offset = getBlockOffset(block);
  const end = indexes.value[`${block.end.getFullYear()}-${block.end.toLocaleString('default', { month: 'long' })}`];
  return end - offset + 1;
}

function onFileChange() {
  if (!fileUploader.value?.files) return;
  const file = fileUploader.value.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    if (!e.target) return;
    const text = e.target.result as string;

    blocks.value = generate(text);
  };
  reader.readAsText(file);
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'o') {
    fileUploader.value?.click();
  } else if (e.key === 'p') {
    htmlToImage.toPng(document.getElementById('chart')!).then(function (dataUrl) {
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = dataUrl;
      link.click();
      link.remove();
    });
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <div class="wrapper">
    <div class="chart" id="chart">
      <div class="column no-year" :class="pendel(true) ? 'other' : ''">
        <div class="year" style="width: 10rem; border-right: 1px solid #000; border-left: 1px solid #000;">
          <div class="header">Arbeitspakete</div>
        </div>
      </div>
      <div v-for="col in columns" class="column">
        <div class="year">
          <div class="header">{{col.year}}</div>
          <div class="months">
            <div v-for="month in col.months" class="month" :class="pendel() ? 'other' : ''">{{month}}</div>
          </div>
        </div>
      </div>

      <div class="chart-items">
        <div v-for="block in blocks" class="chart-item">
          <div class="name">{{block.name}}</div>
          <div class="block" :style="{width: `${getBlockLength(block) * 130}px`, left: `${getBlockOffset(block) * 130 + 160}px`}"></div>
        </div>
      </div>
    </div>
  </div>

  <input style="display: none" ref="fileUploader" type="file" @change="onFileChange" />
</template>

<style lang="scss">
.wrapper {
  left: 0;
  top: 0;
  padding: 2rem;
  margin: 0;
  position: absolute;
  height: calc(100vh - 4rem);

  .chart {
    display: flex;
    flex-direction: row;
    height: 100%;
    border: 1px solid #000;
    position: relative;
    font-family: 'Arial', sans-serif;

    .column {
      display: flex;
      flex-direction: column;
      flex: 0 0 100px;
      background-color: #fff;

      .year {
        display: flex;
        flex-direction: column;
        flex: 1;

        .header {
          background-color: #000;
          color: #fff;
          text-align: center;
          padding: 5px;
        }

        .months {
          display: flex;
          flex-direction: row;
          flex: 1;
          .month {
            flex: 1;
            text-align: center;
            padding: 5px;
            width: 120px;
            background-color: #fff;
            &.other {
              background-color: #f0f0f0;
            }
          }
        }
      }
    }

    .no-year {
      flex: 0 0 50px;
    }

    .chart-items {
      $offset: 4rem;
      position: absolute;
      top: #{$offset};
      left: 0;
      display: flex;
      flex-direction: column;
      z-index: 1;
      gap: 0.5rem;
      .chart-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        position: relative;
        .name {
          flex: 0 0 11rem;
          padding: 5px;
        }
        .block {
          position: absolute;
          height: 1rem;
          background-color: #15a8d5;
          border: 1px solid #000;
        }
      }
    }
  }
}
</style>
