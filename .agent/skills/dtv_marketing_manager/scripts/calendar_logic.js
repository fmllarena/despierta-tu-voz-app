/**
 * Calendar Logic - Determina la estrategia según el día de la semana
 */

const fs = require('fs');
const path = require('path');

const WEEKLY_PLAN_PATH = path.join(__dirname, '..', 'resources', 'weekly_plan.json');

class CalendarLogic {
    constructor() {
        this.weeklyPlan = this.loadWeeklyPlan();
    }

    /**
     * Carga el plan semanal desde JSON
     */
    loadWeeklyPlan() {
        const data = fs.readFileSync(WEEKLY_PLAN_PATH, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Obtiene el día actual en formato lowercase
     */
    getCurrentDay() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        return days[today.getDay()];
    }

    /**
     * Obtiene la estrategia para un día específico
     */
    getStrategyForDay(day) {
        const dayLower = day.toLowerCase();
        const strategy = this.weeklyPlan.weekly_strategy[dayLower];

        if (!strategy) {
            throw new Error(`No se encontró estrategia para el día: ${day}`);
        }

        return {
            ...strategy,
            day: dayLower,
            brand_guidelines: this.weeklyPlan.brand_guidelines
        };
    }

    /**
     * Obtiene la estrategia para un nicho específico
     */
    getNicheStrategy(nicheKey) {
        const niche = this.weeklyPlan.niche_targets[nicheKey];

        if (!niche) {
            throw new Error(`No se encontró nicho con la clave: ${nicheKey}`);
        }

        return {
            type: 'Niche',
            theme: niche.theme,
            focus: niche.focus,
            tone: niche.tone,
            cta: "Descubre más", // Default CTA for niches
            cta_url: "https://despiertatuvoz.vercel.app",
            brand_guidelines: this.weeklyPlan.brand_guidelines,
            avoid_phrases: this.weeklyPlan.weekly_strategy.monday.avoid_phrases, // Use general avoid phrases
            hashtags_priority: niche.keywords,
            niche_meta: niche // Keep original meta
        };
    }

    /**
     * Obtiene las directrices de marca
     */
    getBrandGuidelines() {
        return this.weeklyPlan.brand_guidelines;
    }

    /**
     * Valida que no se usen frases prohibidas
     */
    validateCopy(copy, strategy) {
        const avoidPhrases = strategy.avoid_phrases || [];
        const copyLower = copy.toLowerCase();

        for (const phrase of avoidPhrases) {
            if (copyLower.includes(phrase.toLowerCase())) {
                throw new Error(`Copy contiene frase prohibida: "${phrase}"`);
            }
        }

        return true;
    }
}

module.exports = new CalendarLogic();
