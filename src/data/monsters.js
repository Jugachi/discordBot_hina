let messageCount = 0;


function randomChancePerMessage() {
	const percentChance = 20;
	const randomNum = Math.floor(Math.random()* 100) + 1;

	if (randomNum <= percentChance) {
		const totalMessages = 100;
		const desiredCount = Math.floor(Math.random() * totalMessages);
		return { desiredCount }
	}
}

module.exports = {
	messageCount,
	randomChancePerMessage
}