import {Entity, PrimaryColumn, Column, UpdateDateColumn, CreateDateColumn} from "typeorm";

@Entity()
export class LineGroup {

    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @UpdateDateColumn()
    update_date: Date;

    @CreateDateColumn()
    create_date: Date;

    @Column()
    picture_url: string;

}
