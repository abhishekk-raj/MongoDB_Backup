import {CronJob} from 'cron';

class MongoBkp {

    cronJob: CronJob;

    public takeMongoBackup(): void {
        this.cronJob = new CronJob('* * * * * *', async () => {
            try {
                console.log('Running...');
            } catch (e) {
                console.error(e);
            }
        });

        // Start job
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
        console.log('Started App...');
    }
}

const mongoBkp = new MongoBkp();
mongoBkp.takeMongoBackup();
