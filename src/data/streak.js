let streak;

function streakChecker(streak) {
	let streakBonus = 1.0;
	
	if (streak >= 3) {
		streakBonus = 1.01;
	}
	if (streak >= 5) {
		streakBonus = 1.02;
	}
	if (streak >= 7) {
		streakBonus = 1.03;
	}
	if (streak >= 10) {
		streakBonus = 1.05;
	}
	if (streak >= 30) {
		streakBonus = 1.1;
	}

	return streakBonus;

}

module.exports = {
	streakChecker
}