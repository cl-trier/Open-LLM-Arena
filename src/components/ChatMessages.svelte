<script lang="ts">
    import IconSparkles from '~icons/heroicons/sparkles';
    import IconExclamationCircle from '~icons/heroicons/exclamation-circle';
    import IconCheckCircle from '~icons/heroicons/check-circle';
    import IconArrowPath from '~icons/heroicons/arrow-path';

    import type { ConversationStatus, Message } from 'types';

    import { MODELS } from "@assets/models";
    import { renderMarkdown } from "@services/markdown";

    import { ACTIVE_STATUSES, conversationsStore, draftsStore, isGeneratingStore, retryModel } from "@stores/messages";
    import { selectionStore } from "@stores/selection";

    const STATUS_STYLES: Record<ConversationStatus, string> = {
        loading: 'text-blue-500 animate-spin',
        streaming: 'text-blue-500 animate-spin',
        error: 'text-red-500',
        idle: 'text-green-500',
    };

    /** Keeps a scroll container pinned to the bottom while content grows, unless the user scrolled up. */
    function stickToBottom(node: HTMLElement) {
        let pinned = true;
        const onScroll = () => {
            pinned = node.scrollHeight - node.scrollTop - node.clientHeight < 32;
        };
        const observer = new MutationObserver(() => {
            if (pinned) node.scrollTop = node.scrollHeight;
        });

        node.scrollTop = node.scrollHeight;
        node.addEventListener('scroll', onScroll);
        observer.observe(node, { childList: true, subtree: true, characterData: true });

        return () => {
            observer.disconnect();
            node.removeEventListener('scroll', onScroll);
        };
    }
</script>

{#snippet messageView(message: Message)}
    <div class="pb-3 border-b border-gray-100 last:border-0">
        <span class="font-bold text-sm uppercase text-gray-600 mb-1 block">
            {message.role}
        </span>

        {#if message.reasoning}
            <details class="mt-1 mb-2 text-sm text-gray-500">
                <summary class="cursor-pointer select-none">Reasoning</summary>
                <div class="mt-2 pl-3 border-l-2 border-gray-200 prose prose-sm max-w-none text-gray-500">
                    {@html renderMarkdown(message.reasoning)}
                </div>
            </details>
        {/if}

        <div class="mt-1 text-gray-800 prose prose-sm max-w-none">
            {@html renderMarkdown(message.content)}
        </div>

        {#if message.truncated}
            <p class="mt-1 text-xs italic text-amber-600">Response truncated: token limit reached.</p>
        {/if}
    </div>
{/snippet}

{#if $selectionStore.models.length === 0}
    <div class="w-auto max-w-4xl mx-auto my-12 text-center text-gray-500 italic">
        Please select at least one model to start chatting
    </div>
{:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {#each Object.entries($conversationsStore) as [modelUrl, conversation] (modelUrl)}
            {@const model = MODELS.find(m => m.url === modelUrl)}
            {@const draft = $draftsStore[modelUrl]}
            {#if model}
                <div class="bg-white rounded-xl shadow-md p-6 flex flex-col h-full" data-model={modelUrl}>
                    <div class="mb-4 pb-4 border-b border-gray-200 flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-bold">{model.name}</h3>
                            <p class="text-sm text-gray-500">{model.size}B parameters</p>
                        </div>
                        <div class="text-2xl {STATUS_STYLES[conversation.status]}" title={conversation.status}>
                            {#if ACTIVE_STATUSES.has(conversation.status)}
                                <IconArrowPath />
                            {:else if conversation.status === 'error'}
                                <IconExclamationCircle />
                            {:else}
                                <IconCheckCircle />
                            {/if}
                        </div>
                    </div>

                    {#if conversation.status === 'error' && conversation.error}
                        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700
                            flex justify-between items-start gap-3">
                            <span>{conversation.error}</span>
                            <button
                                class="shrink-0 flex items-center gap-1 font-medium cursor-pointer hover:text-red-900
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                onclick={() => retryModel(modelUrl)}
                                disabled={$isGeneratingStore}
                            >
                                <IconArrowPath />
                                <span>Retry</span>
                            </button>
                        </div>
                    {/if}

                    <div class="flex flex-col gap-4 grow overflow-y-auto max-h-[400px]" {@attach stickToBottom}>
                        {#each conversation.messages as message}
                            {@render messageView(message)}
                        {/each}

                        {#if draft}
                            {@render messageView(draft)}
                        {/if}

                        {#if ACTIVE_STATUSES.has(conversation.status) && !draft?.content}
                            <div class="flex items-center gap-2 text-gray-500 animate-pulse">
                                <IconSparkles />
                                <span class="text-sm">{draft?.reasoning ? 'Reasoning...' : 'Generating response...'}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        {/each}
    </div>
{/if}
