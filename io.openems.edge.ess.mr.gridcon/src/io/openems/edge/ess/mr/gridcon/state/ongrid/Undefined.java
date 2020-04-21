package io.openems.edge.ess.mr.gridcon.state.ongrid;

import io.openems.common.exceptions.OpenemsError.OpenemsNamedException;
import io.openems.edge.ess.mr.gridcon.IState;

public class Undefined extends BasteState {

	@Override
	public IState getState() {
		return OnGridState.UNDEFINED;
	}

	@Override
	public IState getNextState() {
		return OnGridState.ONGRID; //Currently it is ot defined, so it is always ongrid
	}

	@Override
	public void act() throws OpenemsNamedException {
		// Nothing to do		
	}

}