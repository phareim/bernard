// Description:
//   Testbed for new commands.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//

module.exports = function (robot) {
	robot.respond(/hvordan er været?/i, function (res) {
        res.send('Aner ikke');
	});
}