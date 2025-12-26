import { extension_settings, renderExtensionTemplateAsync, getContext } from '../../../extensions.js';

const MODULE_KEY = 'idle_prefix';
const EXTENSION_NAME = 'third-party/Extension-Idle-Prefix';
const DEFAULT_SETTINGS = {
    threshold_minutes: 5,
    prefix_template: '*{{idle_duration}} passed*',
};

function getMoment() {
    return globalThis.SillyTavern?.libs?.moment ?? globalThis.moment;
}

function normalizeSettings() {
    let settings = extension_settings[MODULE_KEY];
    let updated = false;

    if (!settings || typeof settings !== 'object') {
        settings = {};
        extension_settings[MODULE_KEY] = settings;
        updated = true;
    }

    if (!Number.isFinite(settings.threshold_minutes) || settings.threshold_minutes < 0) {
        settings.threshold_minutes = DEFAULT_SETTINGS.threshold_minutes;
        updated = true;
    }

    if (typeof settings.prefix_template !== 'string') {
        settings.prefix_template = DEFAULT_SETTINGS.prefix_template;
        updated = true;
    }

    return { settings, updated };
}

function findLastNonSystemMessage(chat, beforeIndex) {
    for (let i = beforeIndex; i >= 0; i--) {
        const message = chat[i];
        if (!message || message.is_system) continue;
        return { message, index: i };
    }
    return null;
}

async function maybeAddPrefix(messageId) {
    const context = getContext();
    const { settings } = normalizeSettings();

    if (!Number.isFinite(settings.threshold_minutes) || settings.threshold_minutes <= 0) {
        return;
    }

    const message = context.chat?.[messageId];
    if (!message || !message.is_user) return;

    const previous = findLastNonSystemMessage(context.chat, messageId - 1);
    if (!previous?.message?.send_date) return;

    const momentLib = getMoment();
    if (!momentLib) return;

    const lastMessageMoment = context.timestampToMoment(previous.message.send_date);
    if (!lastMessageMoment?.isValid?.()) return;

    const now = momentLib();
    const duration = momentLib.duration(now.diff(lastMessageMoment));
    const diffMinutes = duration.asMinutes();

    if (!(diffMinutes > settings.threshold_minutes)) return;

    const rawTemplate = String(settings.prefix_template ?? '').trim();
    if (!rawTemplate) return;

    const idleDuration = duration.humanize();
    let prefixText = rawTemplate.replace(/{{idle_duration}}/gi, idleDuration);
    prefixText = context.substituteParams(prefixText);

    const originalText = String(message.mes ?? '');
    message.mes = `${prefixText}${originalText ? '\n' : ''}${originalText}`;

    const messageElement = document.querySelector(`.mes[mesid="${messageId}"]`);
    if (messageElement) {
        context.updateMessageBlock(Number(messageId), message);
    }

    await context.saveChat();
}

jQuery(async () => {
    const context = getContext();
    const { settings, updated } = normalizeSettings();

    const settingsHtml = await renderExtensionTemplateAsync(EXTENSION_NAME, 'settings');
    $('#extensions_settings').append(settingsHtml);

    $('#idle_prefix_threshold')
        .val(settings.threshold_minutes)
        .on('input', (event) => {
            if (!(event.target instanceof HTMLInputElement)) return;
            const value = Number(event.target.value);
            settings.threshold_minutes = Number.isFinite(value)
                ? Math.max(0, value)
                : DEFAULT_SETTINGS.threshold_minutes;
            context.saveSettingsDebounced();
        });

    $('#idle_prefix_template')
        .attr('placeholder', DEFAULT_SETTINGS.prefix_template)
        .val(settings.prefix_template)
        .on('input', (event) => {
            if (!(event.target instanceof HTMLInputElement)) return;
            settings.prefix_template = event.target.value;
            context.saveSettingsDebounced();
        });

    $('#idle_prefix_hint').text('Use {{idle_duration}} and other SillyTavern macros.');

    if (updated) {
        context.saveSettingsDebounced();
    }

    context.eventSource.on(context.eventTypes.MESSAGE_SENT, maybeAddPrefix);
});
