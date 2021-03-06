package io.openems.edge.battery.soltaro.cluster.versionc.statemachine;

import io.openems.edge.common.startstop.StartStop;
import io.openems.edge.common.statemachine.StateHandler;

public class StoppedHandler extends StateHandler<State, Context> {

	@Override
	public State runAndGetNextState(Context context) {
		// Mark as stopped
		context.component._setStartStop(StartStop.STOP);

		return State.STOPPED;
	}

}
