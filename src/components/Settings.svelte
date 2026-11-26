<script lang="ts">
    import IconCog from '~icons/heroicons/cog-6-tooth';
    import IconCheckCircle from '~icons/heroicons/check-circle';
    import IconExclamationCircle from '~icons/heroicons/exclamation-circle';
    import IconArrowPath from '~icons/heroicons/arrow-path';

    import { settingsStore, setAccessToken } from "@stores/settings";
    import { verifyToken } from "@services/inference";

    type TokenStatus = 'idle' | 'checking' | 'valid' | 'invalid';

    let accessToken = $state($settingsStore.accessToken);
    let showSettings = $state(!$settingsStore.accessToken);
    let tokenStatus: TokenStatus = $state('idle');
    let tokenMessage = $state('');

    const INPUT_STATUS_STYLES: Record<TokenStatus, string> = {
        idle: '',
        checking: '',
        valid: 'border-green-500 bg-green-50',
        invalid: 'border-red-500 bg-red-50',
    };

    // Picks up the token restored from localStorage after hydration and changes made in other tabs.
    $effect(() => {
        accessToken = $settingsStore.accessToken;
    });

    async function handleTokenChange() {
        const token = accessToken.trim();
        setAccessToken(token);

        if (!token) {
            tokenStatus = 'idle';
            return;
        }

        tokenStatus = 'checking';
        try {
            const name = await verifyToken(token);
            if (accessToken.trim() !== token) return; // superseded by a newer input
            tokenStatus = 'valid';
            tokenMessage = `Token is valid (account: ${name})`;
        } catch (error) {
            if (accessToken.trim() !== token) return;
            tokenStatus = 'invalid';
            tokenMessage = error instanceof Error ? error.message : 'Token check failed';
        }
    }
</script>

<div class="mt-12 px-4 w-auto max-w-4xl mx-auto">
    <button
        class="w-full flex items-center justify-between p-4 bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
        onclick={() => (showSettings = !showSettings)}
        aria-expanded={showSettings}
    >
        <div class="flex items-center gap-2">
            <IconCog class="text-2xl text-gray-600" />
            <h3 class="text-xl font-bold">Settings</h3>
        </div>
        <span class="text-gray-600">{showSettings ? '▼' : '▶'}</span>
    </button>

    {#if showSettings}
        <div class="mt-4 bg-white rounded-xl shadow-sm p-6 space-y-6">
            <!-- API Token -->
            <div>
                <label class="block text-sm font-medium mb-2" for="api-token">
                    Hugging Face API Token
                    <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                    <input
                        id="api-token"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10
                            {INPUT_STATUS_STYLES[tokenStatus]}"
                        type="password"
                        placeholder="hf_..."
                        autocomplete="off"
                        bind:value={accessToken}
                        onchange={handleTokenChange}
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
                        {#if tokenStatus === 'checking'}
                            <IconArrowPath class="text-blue-500 animate-spin" />
                        {:else if tokenStatus === 'valid'}
                            <IconCheckCircle class="text-green-500" />
                        {:else if tokenStatus === 'invalid'}
                            <IconExclamationCircle class="text-red-500" />
                        {/if}
                    </div>
                </div>
                <div class="mt-2 space-y-1">
                    <p class="text-xs text-gray-600">
                        Create a token with the "Make calls to Inference Providers" permission in your
                        <a
                            href="https://huggingface.co/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-emerald-600 hover:underline"
                        >
                            Hugging Face Settings
                        </a>
                    </p>
                    {#if tokenStatus === 'invalid'}
                        <p class="text-xs text-red-600">{tokenMessage}</p>
                    {:else if tokenStatus === 'valid'}
                        <p class="text-xs text-green-600">✓ {tokenMessage}</p>
                    {/if}
                </div>
            </div>

            <!-- Info Section -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-bold text-blue-900 mb-2">About API Access</h4>
                <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Free tier allows limited requests per hour</li>
                    <li>Some models may require PRO subscription</li>
                    <li>Your token is stored locally in your browser</li>
                    <li>Token is never sent to any server except Hugging Face</li>
                </ul>
            </div>

            <!-- Privacy Notice -->
            <div class="text-xs text-gray-500 italic">
                Note: All conversations and settings are stored locally in your browser.
                No data is sent to external servers except API requests to Hugging Face.
            </div>
        </div>
    {/if}
</div>
