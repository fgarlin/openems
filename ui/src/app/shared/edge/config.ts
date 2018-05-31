import { DefaultTypes } from '../service/defaulttypes'
import { Role } from '../type/role'
import { Widget } from '../type/widget'
import { Edge } from './edge';

export class ConfigImpl implements DefaultTypes.Config {

    // FROM VERSION 2018.8
    public readonly components?: {
        [id: string]: {
            'service.pid': string, // unique pid of configuration
            'service.factoryPid': string, // link to 'meta'
            enabled: boolean,
            [channel: string]: string | number | boolean
        }
    }

    // BEVORE VERSION 2018.8
    public readonly things?: {
        [id: string]: {
            id: string,
            alias: string,
            class: string | string[],
            [channel: string]: any
        }
    };

    public readonly meta: {
        [factoryPid: string]: {
            implements: string[],
            channels?: {
                [channel: string]: {
                    name: string,
                    title: string,
                    type: string | string[],
                    optional: boolean,
                    array: boolean,
                    readRoles: Role[],
                    writeRoles: Role[],
                    defaultValue: string
                }
            }
        }
    };

    // A list of thing ids which are matching Natures. (e.g. ["ess0", "ess1"])
    public readonly storageThings: string[] = [];
    public readonly chargers: string[] = [];
    public readonly gridMeters: string[] = [];
    public readonly productionMeters: string[] = [];
    public readonly consumptionMeters: string[] = [];
    public readonly otherMeters: string[] = []; // TODO show otherMeters in Energymonitor
    public readonly bridges: string[] = [];
    public readonly scheduler: string = null;
    public readonly controllers: string[] = [];
    public readonly persistences: string[] = [];
    public readonly simulatorDevices: string[] = [];
    public readonly evcsDevices: string[] = [];

    constructor(private readonly edge: Edge, private readonly config: DefaultTypes.Config) {
        if (edge.isVersionAtLeast("2018.8")) {
            /*
             * FROM VERSION 2018.8
             */
            Object.assign(this, config);

        } else {
            /*
             * VERSION BEFORE 2018.8
             */

            // convert role-strings to Role-objects
            for (let clazz in config.meta) {
                for (let channel in config.meta[clazz].channels) {
                    let roles: Role[] = [];
                    for (let roleString of config.meta[clazz].channels[channel].readRoles) {
                        roles.push(Role.getRole("" + roleString /* convert to string */));
                    }
                    config.meta[clazz].channels[channel].readRoles = roles;
                }
            }

            Object.assign(this, config);

            let storageThings: string[] = []
            let chargers: string[] = [];
            let gridMeters: string[] = [];
            let productionMeters: string[] = [];
            let consumptionMeters: string[] = [];
            let otherMeters: string[] = [];
            let bridges: string[] = [];
            let scheduler: string = null;
            let controllers: string[] = [];
            let persistences: string[] = [];
            let simulatorDevices: string[] = [];
            let evcsDevices: string[] = [];

            for (let thingId in config.things) {
                let thing = config.things[thingId];
                let i = this.getImplements(thing);

                /*
                 * Natures
                 */
                // Ess
                if (i.includes("EssNature")
                    && !i.includes("EssClusterNature") /* ignore cluster */
                    && !i.includes("AsymmetricSymmetricCombinationEssNature") /* ignore symmetric Ess of Pro 9-12 */) {
                    storageThings.push(thingId);
                }
                // Meter
                if (i.includes("MeterNature")) {
                    if ("type" in thing) {
                        if (thing.type == 'grid') {
                            gridMeters.push(thingId);
                        } else if (thing.type === "production") {
                            productionMeters.push(thingId);
                        } else if (thing.type === "consumption") {
                            consumptionMeters.push(thingId);
                        } else {
                            otherMeters.push(thingId);
                        }
                    }
                }
                // Charger
                if (i.includes("ChargerNature")) {
                    productionMeters.push(thingId);
                    chargers.push(thingId);
                }
                /*
                 * Other Things
                 */
                // Bridge
                if (i.includes("io.openems.api.bridge.Bridge")) {
                    bridges.push(thingId);
                }
                // Scheduler
                if (i.includes("io.openems.api.scheduler.Scheduler")) {
                    scheduler = thingId;
                }
                // Controller
                if (i.includes("io.openems.api.controller.Controller")) {
                    controllers.push(thingId);
                }
                // Persistence
                if (i.includes("io.openems.api.persistence.Persistence")) {
                    persistences.push(thingId);
                }
                // Simulator Devices
                if (i.includes("io.openems.impl.device.simulator.Simulator")) {
                    simulatorDevices.push(thingId);
                }
                // Simulator Devices
                if (i.includes("KebaDeviceNature")) {
                    evcsDevices.push(thingId);
                }
            }

            this.storageThings = storageThings.sort();
            this.chargers = chargers.sort();
            this.gridMeters = gridMeters.sort();
            this.productionMeters = productionMeters.sort();
            this.bridges = bridges.sort();
            this.scheduler = scheduler;
            this.controllers = controllers;
            this.persistences = persistences;
            this.simulatorDevices = simulatorDevices;
            this.evcsDevices = evcsDevices;
        }
    }

    public getStateChannels(): DefaultTypes.ChannelAddresses {
        let result: DefaultTypes.ChannelAddresses = {}

        // Set "ignoreNatures"
        for (let thingId in this.config.things) {
            result[thingId] = ["State"];
        }
        return result;
    }


    /**
    * Return ChannelAddresses of power channels
    */
    public getPowerChannels(): DefaultTypes.ChannelAddresses {
        let ignoreNatures = { EssClusterNature: true };
        let result: DefaultTypes.ChannelAddresses = {}

        // Set "ignoreNatures"
        for (let thingId of this.storageThings) {
            let i = this.getImplements(this.config.things[thingId]);

            if (i.includes("FeneconCommercialEss")) { // workaround to ignore asymmetric meter for commercial
                ignoreNatures["AsymmetricMeterNature"] = true;
            }
        }
        // Parse all things
        for (let thingId in this.config.things) {
            let clazz = <string>this.config.things[thingId].class; // TODO casting
            let i = this.getImplements(this.config.things[thingId]);
            let channels = [];
            // ESS
            if (i.includes("EssNature")
                && !i.includes("EssClusterNature") /* ignore cluster */
                && !i.includes("AsymmetricSymmetricCombinationEssNature") /* ignore symmetric Ess of Pro 9-12 */) {
                if (i.includes("FeneconMiniEss")) {
                    channels.push("ActivePowerL1");
                } else if (i.includes("AsymmetricEssNature")) {
                    channels.push("ActivePowerL1", "ActivePowerL2", "ActivePowerL3");
                } else if (i.includes("SymmetricEssNature")) {
                    channels.push("ActivePower");
                }
            }
            // Meter
            if (i.includes("MeterNature")) {
                if (i.includes("AsymmetricMeterNature") && !ignoreNatures["AsymmetricMeterNature"]) {
                    channels.push("ActivePowerL1", "ActivePowerL2", "ActivePowerL3");
                } else if (i.includes("SymmetricMeterNature")) {
                    channels.push("ActivePower");
                }
            }
            // Charger
            if (i.includes("ChargerNature")) {
                channels.push("ActualPower");
            }
            // store result
            if (channels.length > 0) {
                result[thingId] = channels;
            }
        }
        return result;
    }

    /**
     * Returns ChannelAddresses of ESS Soc channels
     */
    public getEssSocChannels(): DefaultTypes.ChannelAddresses {
        let result: DefaultTypes.ChannelAddresses = {}
        for (let thingId of this.storageThings) {
            let channels = [];
            // ESS
            channels.push("Soc");
            // store result
            if (channels.length > 0) {
                result[thingId] = channels;
            }
        }
        return result;
    }

    /**
     * Returns ChannelAddresses required by EVCS widget 
     */
    private getEvcsWidgetChannels(): DefaultTypes.ChannelAddresses {
        let result: DefaultTypes.ChannelAddresses = {}
        for (let thingId of this.evcsDevices) {
            result[thingId] = ["State", "Plug", "CurrUser", "ActualPower", "EnergySession", "EnergyTotal"];
        }
        return result;
    }

    /**
     * Return ChannelAddresses of power and soc channels
     */
    public getImportantChannels(): DefaultTypes.ChannelAddresses {
        let channels: DefaultTypes.ChannelAddresses = {};
        function merge(obj: DefaultTypes.ChannelAddresses) {
            for (let thing in obj) {
                if (thing in channels) {
                    channels[thing] = channels[thing].concat(obj[thing]);
                } else {
                    channels[thing] = obj[thing];
                }
            }
        }
        if (this.edge.isVersionAtLeast("2018.8")) {
            return {
                '_sum': [
                    // Ess
                    'EssSoc', 'EssActivePower', 'EssChargeActivePower', 'EssDischargeActivePower',
                    // Grid
                    'GridActivePower', 'GridMinActivePower', 'GridMaxActivePower',
                    // Production
                    'ProductionActivePower', 'ProductionMaxActivePower',
                    // Consumption
                    'ConsumptionActivePower', 'ConsumptionMaxActivePower'
                ]
            }
        } else {
            // basic channels
            merge(this.getStateChannels());
            merge(this.getPowerChannels());
            merge(this.getEssSocChannels());
            // widget channels
            merge(this.getEvcsWidgetChannels());
        }
        return channels;
    }

    public getWidgets(): Widget[] {
        let widgets: Widget[] = [];
        if (this.evcsDevices.length > 0) {
            widgets.push("EVCS");
        }
        return widgets;
    }

    private getImplements(thing: DefaultTypes.ThingConfig): string | string[] {
        if (<string>thing.class in this.meta) { // TODO casting
            // get implements from meta
            return this.meta[<string>thing.class].implements;
        } else {
            // use class
            return <string>thing.class;
        }
    }
}