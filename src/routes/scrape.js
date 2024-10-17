const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const Club = require('../models/Club');
const Fixture = require('../models/Fixture')
const moment = require('moment');

router.get('/fetch/clubs', async (req, res) => {
    try {
        const { data } = await axios.get('https://www.indiansuperleague.com/clubs');
        const $ = cheerio.load(data);
        const baseURL = "https://www.indiansuperleague.com/";

        $('.club-item').each(async (index, element) => {
            const shortName = $(element).find('.short-name').text().trim();
            const fullName = $(element).find('.full-name').text().trim();
            const venue = $(element).find('.club-venue').text().trim();
            const logoImg = baseURL + ($(element).find('.club-logo img').attr('data-src') || $(element).find('.club-logo img').attr('src'));
            const bannerImg = baseURL + ($(element).find('.club-head img').attr('data-src') || $(element).find('.club-head img').attr('src'));
            const link = baseURL + $(element).find('a.btn').attr('href');
            
            const existingClub = await Club.findOne({ fullName });

            if (!existingClub) {
                await Club.create({ shortName, fullName, venue, logoImg, bannerImg, link });
            } else {
                if (existingClub.shortName !== shortName || existingClub.venue !== venue || 
                    existingClub.logoImg !== logoImg || existingClub.bannerImg !== bannerImg || 
                    existingClub.link !== link) {
                    await Club.updateOne(
                        { fullName },
                        { shortName, venue, logoImg, bannerImg, link }
                    );
                }
            }
        });

        res.status(200).json({ message: 'Club data scraped and saved successfully.'});

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while scraping the data.');
    }
});

// Route to fetch all club data
router.get('/clubs', async (req, res) => {
    try {
        const updatedClubs = await Club.find();
        res.json(updatedClubs);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Failed to fetch clubs' });
    }
});


router.get('/fetch/fixtures', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
    });
  
    const page = await browser.newPage();
  
    // Navigate to the page
    await page.goto('https://www.the-aiff.com/', { waitUntil: 'networkidle0' });
  
    // Wait for the elements to load
    await page.waitForSelector('#fixture_scroll .item');
  
    // Month abbreviations mapping to numbers
    const monthMapping = {
      'Jan': '01',
      'Feb': '02',
      'Mar': '03',
      'Apr': '04',
      'May': '05',
      'Jun': '06',
      'Jul': '07',
      'Aug': '08',
      'Sep': '09',
      'Oct': '10',
      'Nov': '11',
      'Dec': '12'
    };
  
    // Extract the data
    const fixtures = await page.evaluate(() => {
      const fixtureElements = document.querySelectorAll('#fixture_scroll .item');
      const fixtureData = [];
  
      fixtureElements.forEach((element) => {
        const date = element.querySelector('.match_date')?.textContent?.trim(); // Day of the month
        const day = element.querySelector('.day')?.textContent?.trim();         // Day of the week (not used for comparison)
        const monthText = element.querySelector('.day-month')?.textContent.trim(); // "Oct' 2024"
        
        const tournamentName = element.querySelector('.tournament-name a, .tournament-name span')?.textContent?.trim();
        const venue = element.querySelector('.venue')?.textContent?.trim();
  
        const team1Name = element.querySelectorAll('.team-name.text-center')[0]?.textContent?.trim();
        const team2Name = element.querySelectorAll('.team-name.text-center')[1]?.textContent?.trim();
  
        const scoreText = element.querySelector('.score-info span')?.textContent?.trim();
        
        const time = scoreText?.includes(':') ? scoreText : null;
        const team1Score = scoreText?.includes('-') ? scoreText.split('-')[0]?.trim() : null;
        const team2Score = scoreText?.includes('-') ? scoreText.split('-')[1]?.trim() : null;
      
        const team1Logo = element.querySelector('.team-info .image img')?.src || null;
        const team2Logo = element.querySelectorAll('.team-info .image img')[1]?.src || null;
  
        fixtureData.push({
          date,
          day,
          month: monthText,  // Storing the original month text
          tournamentName,
          venue,
          time,
          team1Name,
          team2Name,
          team1Score,
          team2Score,
          team1Logo,
          team2Logo,
          status: null // This will be calculated in the next step
        });
      });
  
      return fixtureData;
    });
  
    // Process the data and determine if the match is upcoming, live, or in the past
    const today = moment(); // Get the current date using moment.js
  
    fixtures.forEach(fixture => {
      // Clean the monthText by removing the day of the week and trim
      const monthYearText = fixture.month.split("\n").pop().trim(); // Get the part after the day of the week
      const cleanedMonthText = monthYearText.replace("'", "").trim(); // Remove the apostrophe and trim spaces
  
      // Split into month abbreviation and year
      const [monthAbbreviation, year] = cleanedMonthText.split(" "); // Now split the cleaned text
      const month = monthMapping[monthAbbreviation]; // Map "Oct" to "10
  
      const day = fixture.date.padStart(2, '0'); // Ensure day is zero-padded
  
      // Construct a valid date string (YYYY-MM-DD)
      const matchDateString = `${year}-${month}-${day}`;
      const matchDate = moment(matchDateString, 'YYYY-MM-DD'); // Parse the constructed date
  
      // Determine if the match is upcoming, live, or past
      if (matchDate.isAfter(today, 'day')) {
          fixture.status = 'upcoming';
          fixture.team1Score = null; // No score for upcoming matches
          fixture.team2Score = null; // No score for upcoming matches
      } else if (matchDate.isSame(today, 'day')) {
          fixture.status = 'live';
          // If the match is live, the score might be available
          if (!fixture.team1Score && !fixture.team2Score) {
              fixture.status = 'upcoming'; // Handle cases where the match is still upcoming today
          }
      } else {
          fixture.status = 'past';
      }
  });
  
    // Save the data to MongoDB
    await Fixture.insertMany(fixtures);
    console.log('Data saved to MongoDB with status');
    
    // Close Puppeteer
    await browser.close();
  });


router.get('/fixtures', async (req, res) => {
    try {
        const fixtures = await Fixture.find();
        res.json(fixtures);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Failed to fetch clubs' });
    }
});
/*
// Route to fetch player data
router.get('/players', async (req, res) => {
    try {
        const clubs = await Club.find();
        const playerData = [];

        for (const club of clubs) {
            const { link } = club;
            const fullProfileURL = `${link}/stats`;

            const { data } = await axios.get(fullProfileURL);
            const $ = cheerio.load(data);
            const playerPosition = $(squadSection).find('h3.sub-title').text().trim();

            $('.squad-item').each(async (index, element) => {
                const playerFirstName = $(element).find('.name first-name').text().trim();
                const playerLastName = $(element).find('.name last-name').text().trim();
                const playerName = `${playerFirstName} ${playerLastName}`;
                const playerImage = $(element).find('.player-thumbnail img').attr('data-src') || $(element).find('.player-thumbnail img').attr('src');

                const stats = {};
                $(element).find('.player-stats-item').each((idx, statElement) => {
                    const statTitle = $(statElement).find('.player-stats-title').text().trim();
                    const statCount = $(statElement).find('.player-stats-count').text().trim();
                    stats[statTitle] = statCount;
                });

                const playerObject = {
                    firstName: playerFirstName,
                    lastName: playerLastName,
                    fullName: playerName,
                    playerNumber: $(element).find('.player-number').text().trim(),
                    position: playerPosition,
                    club: club._id,
                    stats: {
                        matchesPlayed: stats['MATCHES PLAYED'] || 0,
                        tackles: stats['TACKLES'] || 0,
                        assists: stats['ASSISTS'] || 0,
                        goals: stats['GOALS'] || 0
                    },
                    profileLink: fullProfileURL,
                    imageUrl: `https://www.indiansuperleague.com${playerImage}`
                };

                const existingPlayer = await Player.findOne({ fullName: playerName });
                if (!existingPlayer) {
                    await Player.create(playerObject);
                } else {
                    await Player.updateOne(
                        { fullName: playerName },
                        { $set: playerObject }
                    );
                }

                playerData.push(playerObject);
            });
        }

        res.json(playerData);

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching the player data.');
    }
});*/

module.exports = router;