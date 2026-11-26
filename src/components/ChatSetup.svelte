<script lang="ts">
    import IconInformationCircle from '~icons/heroicons/information-circle';

    import { MODELS } from "@assets/models";
    import { PERSONAS } from "@assets/personas";

    import { selectionStore, toggleModel, setPersona } from "@stores/selection";
    import { isGeneratingStore } from "@stores/messages";
    import { liveModelsStore } from "@stores/availability";

    const CARD = "px-4 py-3 bg-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all";
    const CARD_SELECTED = "ring-2 ring-emerald-500 bg-emerald-50";

    const isUnavailable = (url: string) => $liveModelsStore !== null && !$liveModelsStore.has(url);
</script>

<fieldset class="mb-8 px-4 min-w-0 disabled:opacity-60" disabled={$isGeneratingStore}>
    <div class="w-auto max-w-4xl mx-auto">
        <h3 class="text-2xl font-bold mb-4">Select Models</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {#each MODELS as model (model.url)}
                {@const selected = $selectionStore.models.includes(model.url)}
                {@const unavailable = isUnavailable(model.url)}
                <label class={unavailable && !selected ? 'cursor-not-allowed' : 'cursor-pointer'}>
                    <div class="{CARD} {selected ? CARD_SELECTED : ''} {unavailable ? 'opacity-60' : ''}">
                        <div class="flex justify-between items-center gap-2">
                            <div>
                                <input
                                    type="checkbox"
                                    class="mr-2"
                                    checked={selected}
                                    disabled={unavailable && !selected}
                                    onchange={() => toggleModel(model.url)}
                                />
                                <span class="font-bold">{model.name}</span>
                                <span class="text-sm font-thin">({model.size}B)</span>
                                {#if unavailable}
                                    <span class="block text-xs text-red-600">currently unavailable</span>
                                {/if}
                            </div>
                            <a
                                href="https://huggingface.co/{model.url}"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="{model.name} on Hugging Face"
                                title="View on Hugging Face"
                            >
                                <IconInformationCircle />
                            </a>
                        </div>
                    </div>
                </label>
            {/each}
        </div>
    </div>

    <div class="w-auto max-w-4xl mx-auto mt-8">
        <h3 class="text-2xl font-bold mb-4">Select Persona</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {#each PERSONAS as persona (persona.name)}
                {@const selected = $selectionStore.persona === persona.name}
                <label class="cursor-pointer">
                    <div class="{CARD} {selected ? CARD_SELECTED : ''}" title={persona.instruction || 'No system instruction'}>
                        <input
                            type="radio"
                            name="persona"
                            class="mr-2"
                            checked={selected}
                            onchange={() => setPersona(persona.name)}
                        />
                        <span class="pr-1">{persona.icon}</span>
                        <span class="font-bold">{persona.name}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
</fieldset>
