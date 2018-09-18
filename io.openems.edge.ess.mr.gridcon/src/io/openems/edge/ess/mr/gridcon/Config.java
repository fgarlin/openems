package io.openems.edge.ess.mr.gridcon;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition( //
		name = "ESS MR Gridcon PCS", //
		description = "Implements the FENECON MR Gridcon PCS system")
@interface Config {
	String service_pid();

	String id() default "ess0";

	boolean enabled() default true;

	@AttributeDefinition(name = "Modbus-ID", description = "ID of Modbus brige.")
	String modbus_id();

	@AttributeDefinition(name = "Modbus target filter", description = "This is auto-generated by 'Modbus-ID'.")
	String Modbus_target() default "";

	@AttributeDefinition(name = "Modbus-Unit-ID", description = "Unit ID of Modbus brige.")
	int unit_id() default 1;

	@AttributeDefinition(name = "Battery-ID1", description = "ID of Battery 1.")
	String battery1_id();

	@AttributeDefinition(name = "Battery 1 target filter", description = "This is auto-generated by 'Battery-ID1'.")
	String battery1_target() default "";

	@AttributeDefinition(name = "Battery-ID2", description = "ID of Battery 2.")
	String battery2_id();

	@AttributeDefinition(name = "Battery 2 target filter", description = "This is auto-generated by 'Battery-ID2'.")
	String battery2_target() default "";

	@AttributeDefinition(name = "Battery-ID3", description = "ID of Battery 3.")
	String battery3_id();

	@AttributeDefinition(name = "Janitza96Meter", description = "Janitza meter0")
	String meter() default "meter0";

	@AttributeDefinition(name = "Battery 3 target filter", description = "This is auto-generated by 'Battery-ID3'.")
	String battery3_target() default "";

	@AttributeDefinition(name = "Input Channel", description = "Address of the input channel. If the value of this channel is within a configured threshold, the output channel is switched ON.")
	String inputChannelAddress();

	String webconsole_configurationFactory_nameHint() default "ESS MR Gridcon PCS [{id}]";
}