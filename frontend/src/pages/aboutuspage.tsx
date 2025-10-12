import React from "react";

const AboutUsPage: React.FC = () => {
	return (
		<div className="font-sans text-center p-8 bg-yellow-50 text-gray-800">
			{/* <h1 id="title">About Us</h1> wordt gebruik */}
			<h1 className="text-4xl mb-6">About Us</h1>
			<p className="text-xl text-gray-600 mb-4">Wie zijn wij?</p>
			<p className="text-lg text-gray-500">
                Ik ben CamieL Schnackers, een 23 jaar oude student aan de Hogeschool van Heerlen, waar ik de opleiding Software Development volg. Mijn passie ligt in het ontwikkelen van innovatieve softwareoplossingen die echte problemen aanpakken. Met een sterke achtergrond in programmeren en een creatieve benadering van probleemoplossing, streef ik ernaar om technologie te gebruiken om het leven van mensen te verbeteren.
			</p>
		</div>
	);
};

export default AboutUsPage;
